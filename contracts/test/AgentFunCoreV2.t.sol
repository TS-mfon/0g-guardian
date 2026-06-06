// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./Test.sol";
import "../src/AgentFunCoreV2.sol";
import "../src/MockAgentId.sol";

contract AgentFunCoreV2Test is Test {
    AgentFunCoreV2 core;
    MockAgentId identity;
    address creator = address(0xA11CE);
    address user = address(0xB0B);
    address protocol = address(0xFEE);
    address compute = address(0xC0DE);
    bytes32 model = keccak256("deepseek-v4-flash");

    function setUp() public {
        identity = new MockAgentId();
        core = new AgentFunCoreV2(address(identity), protocol, compute);
        core.setModelApproval(model, true);
    }

    receive() external payable {}

    function _mintFor(address account) internal returns (uint256) {
        return identity.mint(account, "0xmetadata", bytes32(uint256(1)));
    }

    function _launch() internal returns (uint256 agentId) {
        uint256 tokenId = _mintFor(creator);
        vm.deal(creator, 10 ether);
        vm.prank(creator);
        agentId = core.launchAgent{value: 0.001 ether}(
            "Researcher",
            "RCH",
            "research",
            tokenId,
            bytes32(uint256(1)),
            bytes32(uint256(2)),
            bytes32(uint256(3)),
            "deepseek-v4-flash"
        );
    }

    function _activate(uint256 agentId) internal {
        vm.prank(creator);
        core.activateAgent{value: 0.1 ether}(agentId);
    }

    function testLaunchRequiresAgentIdOwnership() public {
        uint256 tokenId = _mintFor(user);
        vm.deal(creator, 1 ether);
        vm.prank(creator);
        vm.expectRevert(AgentFunCoreV2.AgentIdNotOwned.selector);
        core.launchAgent{value: 0.001 ether}(
            "Invalid",
            "INV",
            "research",
            tokenId,
            bytes32(uint256(1)),
            bytes32(uint256(2)),
            bytes32(uint256(3)),
            "deepseek-v4-flash"
        );
    }

    function testLaunchRequiresApprovedModel() public {
        uint256 tokenId = _mintFor(creator);
        vm.deal(creator, 1 ether);
        vm.prank(creator);
        vm.expectRevert(AgentFunCoreV2.ModelNotApproved.selector);
        core.launchAgent{value: 0.001 ether}(
            "Invalid",
            "INV",
            "research",
            tokenId,
            bytes32(uint256(1)),
            bytes32(uint256(2)),
            bytes32(uint256(3)),
            "not-approved"
        );
    }

    function testActivationSplitsProtocolAndComputeSeed() public {
        uint256 agentId = _launch();
        _activate(agentId);
        AgentFunCoreV2.Agent memory agent = core.getAgent(agentId);
        assertTrue(agent.computeActive);
        assertEq(core.protocolClaimable(), 0.001 ether + 0.005 ether);
        assertEq(core.computeClaimable(), 0.095 ether);
    }

    function testTaskRequiresComputeActivation() public {
        uint256 agentId = _launch();
        vm.deal(user, 1 ether);
        vm.prank(user);
        vm.expectRevert(AgentFunCoreV2.ComputeNotActive.selector);
        core.createTask{value: 0.0015 ether}(agentId, bytes32(uint256(9)), 0.001 ether, block.timestamp + 1 days);
    }

    function testTaskSettlementRefundsUnusedComputeAndTracksPerAgentRevenue() public {
        uint256 agentId = _launch();
        _activate(agentId);
        vm.deal(user, 1 ether);
        uint256 userBefore = user.balance;
        vm.prank(user);
        uint256 taskId = core.createTask{value: 0.0025 ether}(
            agentId,
            bytes32(uint256(9)),
            0.002 ether,
            block.timestamp + 1 days
        );
        core.markTaskRunning(taskId);
        core.completeTask(taskId, bytes32(uint256(10)), bytes32(uint256(11)), bytes32(uint256(12)), 0.001 ether);

        uint256 serviceGross = 0.0005 ether;
        uint256 protocolFee = (serviceGross * core.protocolFeeBps()) / core.BPS();
        assertEq(core.agentCreatorClaimable(agentId), serviceGross - protocolFee);
        assertEq(core.computeClaimable(), 0.095 ether + 0.001 ether);
        assertEq(user.balance, userBefore - 0.0015 ether);
        AgentFunCoreV2.Task memory task = core.getTask(taskId);
        assertEq(task.actualComputeCost, 0.001 ether);
        assertEq(uint256(task.status), uint256(AgentFunCoreV2.TaskStatus.COMPLETED));
    }

    function testCreatorCanOnlyClaimOwnAgentRevenue() public {
        uint256 agentId = _launch();
        uint256 price = core.getBuyPrice(agentId, 1);
        vm.deal(user, 1 ether);
        vm.prank(user);
        core.buyKeys{value: price}(agentId, 1, price);

        vm.prank(user);
        vm.expectRevert(AgentFunCoreV2.NotAgentCreator.selector);
        core.claimAgentRevenue(agentId);

        uint256 before = creator.balance;
        vm.prank(creator);
        uint256 claimed = core.claimAgentRevenue(agentId);
        assertTrue(claimed > 0);
        assertEq(creator.balance, before + claimed);
        assertEq(core.agentCreatorClaimable(agentId), 0);
    }

    function testTaskCannotSpendAboveComputeBudget() public {
        uint256 agentId = _launch();
        _activate(agentId);
        vm.deal(user, 1 ether);
        vm.prank(user);
        uint256 taskId = core.createTask{value: 0.0015 ether}(
            agentId,
            bytes32(uint256(9)),
            0.001 ether,
            block.timestamp + 1 days
        );
        core.markTaskRunning(taskId);
        vm.expectRevert(AgentFunCoreV2.InvalidInput.selector);
        core.completeTask(taskId, bytes32(uint256(10)), bytes32(uint256(11)), bytes32(uint256(12)), 0.0011 ether);
    }

    function testExpiredTaskRefundsFullEscrow() public {
        uint256 agentId = _launch();
        _activate(agentId);
        vm.deal(user, 1 ether);
        uint256 before = user.balance;
        vm.prank(user);
        uint256 taskId = core.createTask{value: 0.0015 ether}(
            agentId,
            bytes32(uint256(9)),
            0.001 ether,
            block.timestamp + 1 days
        );
        vm.warp(block.timestamp + 2 days);
        vm.prank(user);
        core.cancelExpiredTask(taskId);
        assertEq(user.balance, before);
    }
}
