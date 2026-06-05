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

    receive() external payable {}

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

    function testLaunchFeeAccruesToProtocolOwner() public {
        _launch();
        assertEq(core.claimable(address(this)), 0.001 ether);
    }

    function testProtocolOwnerCanClaimLaunchFee() public {
        _launch();
        uint256 beforeBalance = address(this).balance;
        uint256 claimed = core.claimRevenue();
        assertEq(claimed, 0.001 ether);
        assertEq(core.claimable(address(this)), 0);
        assertEq(address(this).balance, beforeBalance + 0.001 ether);
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

    function testKeyMarketFeesAndPricePump() public {
        uint256 agentId = _launch();
        uint256 firstKey = core.getBuyPrice(agentId, 1);
        vm.deal(user, 10 ether);
        vm.prank(user);
        core.buyKeys{value: firstKey}(agentId, 1);

        uint256 creatorFee = (firstKey * core.creatorFeeBps()) / core.BPS();
        uint256 protocolFee = (firstKey * core.protocolFeeBps()) / core.BPS();
        assertEq(core.claimable(creator), creatorFee);
        assertEq(core.claimable(address(this)), 0.001 ether + protocolFee);
        assertTrue(core.getBuyPrice(agentId, 1) > firstKey);
    }

    function testCreatorCanClaimAfterKeyPurchase() public {
        uint256 agentId = _launch();
        uint256 firstKey = core.getBuyPrice(agentId, 1);
        vm.deal(user, 10 ether);
        vm.prank(user);
        core.buyKeys{value: firstKey}(agentId, 1);

        uint256 creatorFee = (firstKey * core.creatorFeeBps()) / core.BPS();
        uint256 beforeBalance = creator.balance;
        vm.prank(creator);
        uint256 claimed = core.claimRevenue();
        assertEq(claimed, creatorFee);
        assertEq(core.claimable(creator), 0);
        assertEq(creator.balance, beforeBalance + creatorFee);
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

        core.markTaskRunning(taskId);
        core.completeTask(taskId, bytes32(uint256(11)), bytes32(uint256(12)), bytes32(uint256(13)), bytes32(uint256(14)));

        AgentFunCore.Task memory task = core.getTask(taskId);
        assertEq(uint256(task.status), uint256(AgentFunCore.TaskStatus.COMPLETED));
        assertEq(uint256(task.resultRoot), 11);
        assertEq(task.fee, 0);
        assertEq(task.executor, address(this));
        AgentFunCore.Agent memory agent = core.getAgent(agentId);
        assertEq(uint256(agent.memoryRoot), 14);
        assertEq(agent.taskCount, 1);
        uint256 protocolFee = (0.001 ether * core.protocolFeeBps()) / core.BPS();
        assertEq(agent.totalRevenue, 0.001 ether - protocolFee);
        assertEq(core.claimable(creator), 0.001 ether - protocolFee);
        assertEq(core.claimable(address(this)), 0.001 ether + protocolFee);
    }

    function testCreatorCanClaimAfterCompletedTask() public {
        uint256 agentId = _launch();
        uint256 taskId = _createTask(agentId);

        core.markTaskRunning(taskId);
        core.completeTask(taskId, bytes32(uint256(11)), bytes32(uint256(12)), bytes32(uint256(13)), bytes32(uint256(14)));

        uint256 protocolFee = (0.001 ether * core.protocolFeeBps()) / core.BPS();
        uint256 creatorAmount = 0.001 ether - protocolFee;
        uint256 beforeBalance = creator.balance;
        vm.prank(creator);
        uint256 claimed = core.claimRevenue();
        assertEq(claimed, creatorAmount);
        assertEq(core.claimable(creator), 0);
        assertEq(creator.balance, beforeBalance + creatorAmount);
    }

    function testOwnerCanApproveExecutor() public {
        uint256 agentId = _launch();
        uint256 taskId = _createTask(agentId);
        core.setExecutor(executor, true);

        vm.prank(executor);
        core.markTaskRunning(taskId);
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
        core.markTaskRunning(taskId);
        vm.warp(block.timestamp + 2 days);

        vm.expectRevert(AgentFunCore.TaskExpired.selector);
        core.completeTask(taskId, bytes32(uint256(11)), bytes32(uint256(12)), bytes32(uint256(13)), bytes32(uint256(14)));
    }

    function testCannotCompleteOpenTaskWithoutRunningState() public {
        uint256 agentId = _launch();
        uint256 taskId = _createTask(agentId);

        vm.expectRevert(AgentFunCore.InvalidTaskStatus.selector);
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

    function testPaginatedAgentAndTaskIds() public {
        uint256 agentOne = _launch();
        vm.deal(user, 10 ether);
        vm.prank(user);
        uint256 agentTwo = core.launchAgent{value: 0.001 ether}(
            "Beta",
            "BETA",
            "chat",
            102,
            bytes32(uint256(4)),
            bytes32(uint256(5)),
            bytes32(uint256(6))
        );
        uint256 taskOne = _createTask(agentOne);
        uint256 taskTwo = _createTask(agentTwo);

        uint256[] memory agentsPage = core.getAgentIds(1, 10);
        assertEq(agentsPage.length, 1);
        assertEq(agentsPage[0], agentTwo);

        uint256[] memory tasksPage = core.getTaskIds(0, 1);
        assertEq(tasksPage.length, 1);
        assertEq(tasksPage[0], taskOne);

        tasksPage = core.getTaskIds(1, 2);
        assertEq(tasksPage.length, 1);
        assertEq(tasksPage[0], taskTwo);
    }
}
