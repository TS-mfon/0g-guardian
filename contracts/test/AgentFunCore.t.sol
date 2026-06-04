// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./Test.sol";
import "../src/AgentFunCore.sol";

contract AgentFunCoreTest is Test {
    AgentFunCore core;
    address creator = address(0xA11CE);
    address user = address(0xB0B);
    address executor = address(0xE2E);

    function setUp() public {
        core = new AgentFunCore();
    }

    function _launch() internal returns (uint256 agentId) {
        vm.deal(creator, 10 ether);
        vm.prank(creator);
        agentId = core.launchAgent{value: 0.001 ether}(
            "AlphaSeer",
            "ALPHA",
            "trading",
            101,
            bytes32(uint256(1)),
            bytes32(uint256(2)),
            bytes32(uint256(3))
        );
    }

    function testLaunchAgent() public {
        uint256 agentId = _launch();
        AgentFunCore.Agent memory agent = core.getAgent(agentId);
        assertEq(agent.creator, creator);
        assertEq(agent.agentIdTokenId, 101);
        assertTrue(agent.active);
        assertEq(core.getAllAgentIds().length, 1);
    }

    function testRejectDuplicateAgentId() public {
        _launch();
        vm.deal(user, 10 ether);
        vm.prank(user);
        vm.expectRevert(AgentFunCore.AlreadyUsedAgentId.selector);
        core.launchAgent{value: 0.001 ether}(
            "Copy",
            "COPY",
            "chat",
            101,
            bytes32(uint256(4)),
            bytes32(uint256(5)),
            bytes32(uint256(6))
        );
    }

    function testBuyAndSellKeys() public {
        uint256 agentId = _launch();
        uint256 price = core.getBuyPrice(agentId, 3);
        vm.deal(user, 10 ether);
        vm.prank(user);
        core.buyKeys{value: price}(agentId, 3);
        assertEq(core.keyBalance(agentId, user), 3);
        assertEq(core.keySupply(agentId), 3);

        uint256 sellPrice = core.getSellPrice(agentId, 1);
        vm.prank(user);
        core.sellKeys(agentId, 1, sellPrice);
        assertEq(core.keyBalance(agentId, user), 2);
    }

    function _createTask(uint256 agentId) internal returns (uint256 taskId) {
        vm.deal(user, 10 ether);
        vm.prank(user);
        taskId = core.createTask{value: 0.001 ether}(agentId, bytes32(uint256(10)));
    }

    function testRequesterCannotCompleteTaskWithFakeProofs() public {
        uint256 agentId = _launch();
        uint256 taskId = _createTask(agentId);

        vm.prank(user);
        vm.expectRevert(AgentFunCore.NotTaskExecutor.selector);
        core.completeTask(taskId, bytes32(uint256(11)), bytes32(uint256(12)), bytes32(uint256(13)), bytes32(uint256(14)));
    }

    function testCreatorCannotCompleteTaskUnlessExecutor() public {
        uint256 agentId = _launch();
        uint256 taskId = _createTask(agentId);
        vm.prank(creator);
        vm.expectRevert(AgentFunCore.NotTaskExecutor.selector);
        core.completeTask(taskId, bytes32(uint256(11)), bytes32(uint256(12)), bytes32(uint256(13)), bytes32(uint256(14)));
    }

    function testAuthorizedExecutorCompletesTask() public {
        uint256 agentId = _launch();
        uint256 taskId = _createTask(agentId);

        core.completeTask(taskId, bytes32(uint256(11)), bytes32(uint256(12)), bytes32(uint256(13)), bytes32(uint256(14)));

        AgentFunCore.Task memory task = core.getTask(taskId);
        assertEq(uint256(task.status), uint256(AgentFunCore.TaskStatus.COMPLETED));
        assertEq(uint256(task.resultRoot), 11);
        assertEq(task.executor, address(this));
        AgentFunCore.Agent memory agent = core.getAgent(agentId);
        assertEq(uint256(agent.memoryRoot), 14);
        assertEq(agent.taskCount, 1);
        assertEq(agent.totalRevenue, 0.001 ether);
    }

    function testOwnerCanApproveExecutor() public {
        uint256 agentId = _launch();
        uint256 taskId = _createTask(agentId);
        core.setExecutor(executor, true);

        vm.prank(executor);
        core.completeTask(taskId, bytes32(uint256(11)), bytes32(uint256(12)), bytes32(uint256(13)), bytes32(uint256(14)));

        AgentFunCore.Task memory task = core.getTask(taskId);
        assertEq(task.executor, executor);
        assertEq(uint256(task.status), uint256(AgentFunCore.TaskStatus.COMPLETED));
    }

    function testExpiredTaskRefundsRequester() public {
        uint256 agentId = _launch();
        uint256 taskId = _createTask(agentId);
        vm.warp(block.timestamp + 2 days);

        vm.prank(user);
        uint256 refund = core.cancelExpiredTask(taskId);

        assertEq(refund, 0.001 ether);
        AgentFunCore.Task memory task = core.getTask(taskId);
        assertEq(uint256(task.status), uint256(AgentFunCore.TaskStatus.REFUNDED));
    }

    function testCannotCompleteExpiredTask() public {
        uint256 agentId = _launch();
        uint256 taskId = _createTask(agentId);
        vm.warp(block.timestamp + 2 days);

        vm.expectRevert(AgentFunCore.TaskExpired.selector);
        core.completeTask(taskId, bytes32(uint256(11)), bytes32(uint256(12)), bytes32(uint256(13)), bytes32(uint256(14)));
    }

    function testPauseBlocksLaunchTasksAndMarket() public {
        core.setPauseState(true, true, true);
        vm.deal(creator, 10 ether);
        vm.prank(creator);
        vm.expectRevert(AgentFunCore.LaunchesPaused.selector);
        core.launchAgent{value: 0.001 ether}(
            "AlphaSeer",
            "ALPHA",
            "trading",
            101,
            bytes32(uint256(1)),
            bytes32(uint256(2)),
            bytes32(uint256(3))
        );

        core.setPauseState(false, true, true);
        uint256 agentId = _launch();
        vm.deal(user, 10 ether);
        vm.prank(user);
        vm.expectRevert(AgentFunCore.TasksPaused.selector);
        core.createTask{value: 0.001 ether}(agentId, bytes32(uint256(10)));

        vm.prank(user);
        vm.expectRevert(AgentFunCore.MarketPaused.selector);
        core.buyKeys{value: 1 ether}(agentId, 1);
    }

    function testClosedFormKeyPricesMatchOriginalFormula() public {
        uint256 agentId = _launch();
        uint256 amount = 5;
        uint256 expectedBuy;
        for (uint256 i = 1; i <= amount; i += 1) {
            expectedBuy += 0.0001 ether + (i * 0.00002 ether);
        }
        assertEq(core.getBuyPrice(agentId, amount), expectedBuy);

        vm.deal(user, 10 ether);
        vm.prank(user);
        core.buyKeys{value: expectedBuy}(agentId, amount);

        uint256 expectedSell;
        for (uint256 i = 0; i < 2; i += 1) {
            expectedSell += 0.0001 ether + ((amount - i) * 0.00002 ether);
        }
        expectedSell = (expectedSell * 9_000) / core.BPS();
        assertEq(core.getSellPrice(agentId, 2), expectedSell);
    }

    function testOnlyCreatorUpdatesMemory() public {
        uint256 agentId = _launch();
        vm.prank(user);
        vm.expectRevert(AgentFunCore.NotAgentCreator.selector);
        core.updateMemoryRoot(agentId, bytes32(uint256(10)));

        vm.prank(creator);
        core.updateMemoryRoot(agentId, bytes32(uint256(11)));
        AgentFunCore.Agent memory agent = core.getAgent(agentId);
        assertEq(uint256(agent.memoryRoot), 11);
    }
}
