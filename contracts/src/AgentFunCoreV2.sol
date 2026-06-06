// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IAgentIdOwner {
    function ownerOf(uint256 tokenId) external view returns (address);
}

contract AgentFunCoreV2 {
    enum TaskStatus {
        NONE,
        OPEN,
        RUNNING,
        COMPLETED,
        REFUNDED
    }

    struct Agent {
        uint256 id;
        address creator;
        uint256 agentIdTokenId;
        string name;
        string symbol;
        string category;
        bytes32 metadataRoot;
        bytes32 memoryRoot;
        bytes32 capabilityHash;
        string modelId;
        bytes32 modelHash;
        uint256 createdAt;
        bool active;
        bool computeActive;
        uint256 taskCount;
        uint256 totalRevenue;
    }

    struct Task {
        uint256 id;
        uint256 agentId;
        address requester;
        address executor;
        uint256 fee;
        uint256 computeBudget;
        uint256 actualComputeCost;
        bytes32 promptRoot;
        bytes32 resultRoot;
        bytes32 computeHash;
        TaskStatus status;
        uint256 createdAt;
        uint256 deadline;
        uint256 completedAt;
        uint8 rating;
    }

    uint256 public constant BPS = 10_000;
    IAgentIdOwner public immutable agentIdContract;
    address public owner;
    address public pendingOwner;
    address public protocolTreasury;
    address public computeTreasury;
    uint256 public launchFee = 0.001 ether;
    uint256 public activationFee = 0.1 ether;
    uint256 public minTaskFee = 0.0005 ether;
    uint256 public protocolFeeBps = 500;
    uint256 public nextAgentId = 1;
    uint256 public nextTaskId = 1;
    bool public launchesPaused;
    bool public tasksPaused;
    bool public marketPaused;
    bool private locked;

    mapping(uint256 => Agent) private agents;
    mapping(uint256 => Task) private tasks;
    mapping(uint256 => bool) public agentExists;
    mapping(uint256 => bool) public agentIdTokenUsed;
    mapping(bytes32 => bool) public approvedModels;
    mapping(address => bool) public taskExecutors;
    mapping(uint256 => mapping(address => uint256)) public keyBalance;
    mapping(uint256 => uint256) public keySupply;
    mapping(uint256 => uint256) public agentReserve;
    mapping(uint256 => uint256) public agentCreatorClaimable;
    uint256 public protocolClaimable;
    uint256 public computeClaimable;
    uint256[] private allAgentIds;
    uint256[] private allTaskIds;

    event AgentLaunched(uint256 indexed agentId, address indexed creator, uint256 indexed agentIdTokenId, bytes32 modelHash);
    event AgentActivated(uint256 indexed agentId, bytes32 indexed modelHash, uint256 computeSeed, uint256 protocolFee);
    event AgentMemoryUpdated(uint256 indexed agentId, bytes32 previousRoot, bytes32 newRoot);
    event AgentStatusChanged(uint256 indexed agentId, bool active);
    event ModelApprovalChanged(bytes32 indexed modelHash, bool approved);
    event ExecutorUpdated(address indexed executor, bool allowed);
    event KeysBought(uint256 indexed agentId, address indexed buyer, uint256 keysOut, uint256 paid);
    event KeysSold(uint256 indexed agentId, address indexed seller, uint256 keysIn, uint256 received);
    event TaskCreated(uint256 indexed taskId, uint256 indexed agentId, address indexed requester, uint256 fee, uint256 computeBudget);
    event TaskRunning(uint256 indexed taskId, address indexed executor);
    event TaskCompleted(
        uint256 indexed taskId,
        uint256 indexed agentId,
        bytes32 resultRoot,
        bytes32 computeHash,
        bytes32 newMemoryRoot,
        uint256 creatorAmount,
        uint256 protocolFee,
        uint256 computeCost,
        uint256 refund
    );
    event TaskRefunded(uint256 indexed taskId, address indexed requester, uint256 amount);
    event AgentRevenueClaimed(uint256 indexed agentId, address indexed creator, uint256 amount);
    event TreasuryRevenueClaimed(address indexed treasury, uint256 amount, bool compute);

    error NotOwner();
    error NotPendingOwner();
    error NotAgentCreator();
    error AgentNotFound();
    error TaskNotFound();
    error InvalidInput();
    error InsufficientPayment();
    error AlreadyUsedAgentId();
    error AgentIdNotOwned();
    error ModelNotApproved();
    error ComputeNotActive();
    error InsufficientKeys();
    error TransferFailed();
    error InvalidTaskStatus();
    error NotTaskExecutor();
    error TaskExpired();
    error TaskNotExpired();
    error Paused();
    error Reentrancy();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyAgentCreator(uint256 agentId) {
        if (!agentExists[agentId]) revert AgentNotFound();
        if (agents[agentId].creator != msg.sender) revert NotAgentCreator();
        _;
    }

    modifier onlyTaskExecutor() {
        if (!taskExecutors[msg.sender]) revert NotTaskExecutor();
        _;
    }

    modifier nonReentrant() {
        if (locked) revert Reentrancy();
        locked = true;
        _;
        locked = false;
    }

    constructor(address agentIdAddress, address protocolTreasuryAddress, address computeTreasuryAddress) {
        if (agentIdAddress == address(0) || protocolTreasuryAddress == address(0) || computeTreasuryAddress == address(0)) {
            revert InvalidInput();
        }
        owner = msg.sender;
        agentIdContract = IAgentIdOwner(agentIdAddress);
        protocolTreasury = protocolTreasuryAddress;
        computeTreasury = computeTreasuryAddress;
        taskExecutors[msg.sender] = true;
    }

    function modelHash(string calldata modelId) public pure returns (bytes32) {
        return keccak256(bytes(modelId));
    }

    function setModelApproval(bytes32 hash, bool approved) external onlyOwner {
        if (hash == bytes32(0)) revert InvalidInput();
        approvedModels[hash] = approved;
        emit ModelApprovalChanged(hash, approved);
    }

    function setExecutor(address executor, bool allowed) external onlyOwner {
        if (executor == address(0)) revert InvalidInput();
        taskExecutors[executor] = allowed;
        emit ExecutorUpdated(executor, allowed);
    }

    function setPauseState(bool pauseLaunches, bool pauseTasks, bool pauseMarket) external onlyOwner {
        launchesPaused = pauseLaunches;
        tasksPaused = pauseTasks;
        marketPaused = pauseMarket;
    }

    function setFees(uint256 newLaunchFee, uint256 newActivationFee, uint256 newMinTaskFee, uint256 newProtocolFeeBps)
        external
        onlyOwner
    {
        if (newProtocolFeeBps > 2_000) revert InvalidInput();
        launchFee = newLaunchFee;
        activationFee = newActivationFee;
        minTaskFee = newMinTaskFee;
        protocolFeeBps = newProtocolFeeBps;
    }

    function setTreasuries(address newProtocolTreasury, address newComputeTreasury) external onlyOwner {
        if (newProtocolTreasury == address(0) || newComputeTreasury == address(0)) revert InvalidInput();
        protocolTreasury = newProtocolTreasury;
        computeTreasury = newComputeTreasury;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidInput();
        pendingOwner = newOwner;
    }

    function acceptOwnership() external {
        if (msg.sender != pendingOwner) revert NotPendingOwner();
        owner = pendingOwner;
        pendingOwner = address(0);
    }

    function launchAgent(
        string calldata name,
        string calldata symbol,
        string calldata category,
        uint256 agentIdTokenId,
        bytes32 metadataRoot,
        bytes32 memoryRoot,
        bytes32 capabilityHash,
        string calldata selectedModelId
    ) external payable returns (uint256 agentId) {
        if (launchesPaused) revert Paused();
        if (msg.value < launchFee) revert InsufficientPayment();
        if (bytes(name).length == 0 || bytes(name).length > 80 || bytes(symbol).length == 0 || bytes(symbol).length > 16) {
            revert InvalidInput();
        }
        if (bytes(category).length == 0 || bytes(category).length > 40) revert InvalidInput();
        if (
            agentIdTokenId == 0 || metadataRoot == bytes32(0) || memoryRoot == bytes32(0)
                || capabilityHash == bytes32(0) || bytes(selectedModelId).length == 0
        ) revert InvalidInput();
        bytes32 selectedModelHash = modelHash(selectedModelId);
        if (!approvedModels[selectedModelHash]) revert ModelNotApproved();
        if (agentIdTokenUsed[agentIdTokenId]) revert AlreadyUsedAgentId();
        if (agentIdContract.ownerOf(agentIdTokenId) != msg.sender) revert AgentIdNotOwned();

        agentId = nextAgentId++;
        agents[agentId] = Agent({
            id: agentId,
            creator: msg.sender,
            agentIdTokenId: agentIdTokenId,
            name: name,
            symbol: symbol,
            category: category,
            metadataRoot: metadataRoot,
            memoryRoot: memoryRoot,
            capabilityHash: capabilityHash,
            modelId: selectedModelId,
            modelHash: selectedModelHash,
            createdAt: block.timestamp,
            active: true,
            computeActive: false,
            taskCount: 0,
            totalRevenue: 0
        });
        agentExists[agentId] = true;
        agentIdTokenUsed[agentIdTokenId] = true;
        allAgentIds.push(agentId);
        protocolClaimable += msg.value;
        emit AgentLaunched(agentId, msg.sender, agentIdTokenId, selectedModelHash);
    }

    function activateAgent(uint256 agentId) external payable onlyAgentCreator(agentId) {
        if (msg.value < activationFee) revert InsufficientPayment();
        Agent storage agent = agents[agentId];
        if (!approvedModels[agent.modelHash]) revert ModelNotApproved();
        uint256 protocolFee = (msg.value * protocolFeeBps) / BPS;
        uint256 computeSeed = msg.value - protocolFee;
        agent.computeActive = true;
        protocolClaimable += protocolFee;
        computeClaimable += computeSeed;
        emit AgentActivated(agentId, agent.modelHash, computeSeed, protocolFee);
    }

    function updateMemoryRoot(uint256 agentId, bytes32 newMemoryRoot) external onlyAgentCreator(agentId) {
        if (newMemoryRoot == bytes32(0)) revert InvalidInput();
        bytes32 previousRoot = agents[agentId].memoryRoot;
        agents[agentId].memoryRoot = newMemoryRoot;
        emit AgentMemoryUpdated(agentId, previousRoot, newMemoryRoot);
    }

    function setAgentActive(uint256 agentId, bool active) external onlyAgentCreator(agentId) {
        agents[agentId].active = active;
        emit AgentStatusChanged(agentId, active);
    }

    function buyKeys(uint256 agentId, uint256 keysOut, uint256 maxPayment) external payable returns (uint256 paid) {
        if (marketPaused) revert Paused();
        if (!agentExists[agentId] || keysOut == 0) revert InvalidInput();
        paid = getBuyPrice(agentId, keysOut);
        if (paid > maxPayment || msg.value < paid) revert InsufficientPayment();
        uint256 creatorFee = (paid * 300) / BPS;
        uint256 protocolFee = (paid * 200) / BPS;
        agentCreatorClaimable[agentId] += creatorFee;
        protocolClaimable += protocolFee + (msg.value - paid);
        agentReserve[agentId] += paid - creatorFee - protocolFee;
        keyBalance[agentId][msg.sender] += keysOut;
        keySupply[agentId] += keysOut;
        emit KeysBought(agentId, msg.sender, keysOut, paid);
    }

    function sellKeys(uint256 agentId, uint256 keysIn, uint256 minOut) external nonReentrant returns (uint256 payout) {
        if (marketPaused) revert Paused();
        if (!agentExists[agentId] || keysIn == 0) revert InvalidInput();
        if (keyBalance[agentId][msg.sender] < keysIn) revert InsufficientKeys();
        payout = getSellPrice(agentId, keysIn);
        if (payout < minOut || payout > agentReserve[agentId]) revert InvalidInput();
        keyBalance[agentId][msg.sender] -= keysIn;
        keySupply[agentId] -= keysIn;
        agentReserve[agentId] -= payout;
        (bool ok,) = msg.sender.call{value: payout}("");
        if (!ok) revert TransferFailed();
        emit KeysSold(agentId, msg.sender, keysIn, payout);
    }

    function createTask(uint256 agentId, bytes32 promptRoot, uint256 computeBudget, uint256 deadline)
        external
        payable
        returns (uint256 taskId)
    {
        if (tasksPaused) revert Paused();
        if (!agentExists[agentId]) revert AgentNotFound();
        Agent storage agent = agents[agentId];
        if (!agent.active || !agent.computeActive) revert ComputeNotActive();
        if (promptRoot == bytes32(0) || computeBudget == 0 || deadline <= block.timestamp) revert InvalidInput();
        if (msg.value < minTaskFee + computeBudget) revert InsufficientPayment();
        taskId = nextTaskId++;
        tasks[taskId] = Task({
            id: taskId,
            agentId: agentId,
            requester: msg.sender,
            executor: address(0),
            fee: msg.value,
            computeBudget: computeBudget,
            actualComputeCost: 0,
            promptRoot: promptRoot,
            resultRoot: bytes32(0),
            computeHash: bytes32(0),
            status: TaskStatus.OPEN,
            createdAt: block.timestamp,
            deadline: deadline,
            completedAt: 0,
            rating: 0
        });
        allTaskIds.push(taskId);
        agent.taskCount += 1;
        emit TaskCreated(taskId, agentId, msg.sender, msg.value, computeBudget);
    }

    function markTaskRunning(uint256 taskId) external onlyTaskExecutor {
        if (tasks[taskId].id == 0) revert TaskNotFound();
        Task storage task = tasks[taskId];
        if (task.status != TaskStatus.OPEN) revert InvalidTaskStatus();
        if (block.timestamp > task.deadline) revert TaskExpired();
        task.executor = msg.sender;
        task.status = TaskStatus.RUNNING;
        emit TaskRunning(taskId, msg.sender);
    }

    function completeTask(
        uint256 taskId,
        bytes32 resultRoot,
        bytes32 computeHash,
        bytes32 newMemoryRoot,
        uint256 actualComputeCost
    ) external onlyTaskExecutor nonReentrant {
        if (tasks[taskId].id == 0) revert TaskNotFound();
        Task storage task = tasks[taskId];
        if (task.status != TaskStatus.RUNNING) revert InvalidTaskStatus();
        if (block.timestamp > task.deadline) revert TaskExpired();
        if (resultRoot == bytes32(0) || computeHash == bytes32(0) || newMemoryRoot == bytes32(0)) revert InvalidInput();
        if (actualComputeCost > task.computeBudget) revert InvalidInput();

        Agent storage agent = agents[task.agentId];
        uint256 serviceGross = task.fee - task.computeBudget;
        uint256 protocolFee = (serviceGross * protocolFeeBps) / BPS;
        uint256 creatorAmount = serviceGross - protocolFee;
        uint256 refund = task.computeBudget - actualComputeCost;
        task.actualComputeCost = actualComputeCost;
        task.fee = 0;
        task.resultRoot = resultRoot;
        task.computeHash = computeHash;
        task.status = TaskStatus.COMPLETED;
        task.completedAt = block.timestamp;
        bytes32 previousRoot = agent.memoryRoot;
        agent.memoryRoot = newMemoryRoot;
        agent.totalRevenue += creatorAmount;
        agentCreatorClaimable[task.agentId] += creatorAmount;
        protocolClaimable += protocolFee;
        computeClaimable += actualComputeCost;
        if (refund > 0) {
            (bool ok,) = task.requester.call{value: refund}("");
            if (!ok) revert TransferFailed();
        }
        emit AgentMemoryUpdated(task.agentId, previousRoot, newMemoryRoot);
        emit TaskCompleted(taskId, task.agentId, resultRoot, computeHash, newMemoryRoot, creatorAmount, protocolFee, actualComputeCost, refund);
    }

    function cancelExpiredTask(uint256 taskId) external nonReentrant returns (uint256 refund) {
        if (tasks[taskId].id == 0) revert TaskNotFound();
        Task storage task = tasks[taskId];
        if (task.status != TaskStatus.OPEN && task.status != TaskStatus.RUNNING) revert InvalidTaskStatus();
        if (block.timestamp <= task.deadline) revert TaskNotExpired();
        if (msg.sender != task.requester) revert InvalidTaskStatus();
        refund = task.fee;
        task.status = TaskStatus.REFUNDED;
        task.fee = 0;
        (bool ok,) = msg.sender.call{value: refund}("");
        if (!ok) revert TransferFailed();
        emit TaskRefunded(taskId, msg.sender, refund);
    }

    function rateTask(uint256 taskId, uint8 rating) external {
        Task storage task = tasks[taskId];
        if (task.id == 0) revert TaskNotFound();
        if (task.requester != msg.sender || task.status != TaskStatus.COMPLETED) revert InvalidTaskStatus();
        if (rating == 0 || rating > 5) revert InvalidInput();
        task.rating = rating;
    }

    function claimAgentRevenue(uint256 agentId) external nonReentrant onlyAgentCreator(agentId) returns (uint256 amount) {
        amount = agentCreatorClaimable[agentId];
        if (amount == 0) revert InvalidInput();
        agentCreatorClaimable[agentId] = 0;
        (bool ok,) = msg.sender.call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit AgentRevenueClaimed(agentId, msg.sender, amount);
    }

    function claimProtocolRevenue() external nonReentrant returns (uint256 amount) {
        if (msg.sender != protocolTreasury) revert NotOwner();
        amount = protocolClaimable;
        if (amount == 0) revert InvalidInput();
        protocolClaimable = 0;
        (bool ok,) = msg.sender.call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit TreasuryRevenueClaimed(msg.sender, amount, false);
    }

    function claimComputeRevenue() external nonReentrant returns (uint256 amount) {
        if (msg.sender != computeTreasury) revert NotOwner();
        amount = computeClaimable;
        if (amount == 0) revert InvalidInput();
        computeClaimable = 0;
        (bool ok,) = msg.sender.call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit TreasuryRevenueClaimed(msg.sender, amount, true);
    }

    function getBuyPrice(uint256 agentId, uint256 amount) public view returns (uint256) {
        uint256 supply = keySupply[agentId];
        if (amount == 0) return 0;
        uint256 start = supply + 1;
        uint256 end = supply + amount;
        return (amount * 0.0001 ether) + ((((start + end) * amount) / 2) * 0.00002 ether);
    }

    function getSellPrice(uint256 agentId, uint256 amount) public view returns (uint256) {
        uint256 supply = keySupply[agentId];
        if (amount > supply) revert InvalidInput();
        if (amount == 0) return 0;
        uint256 start = supply - amount + 1;
        uint256 total = (amount * 0.0001 ether) + ((((start + supply) * amount) / 2) * 0.00002 ether);
        return (total * 9_000) / BPS;
    }

    function getAgent(uint256 agentId) external view returns (Agent memory) {
        if (!agentExists[agentId]) revert AgentNotFound();
        return agents[agentId];
    }

    function getTask(uint256 taskId) external view returns (Task memory) {
        if (tasks[taskId].id == 0) revert TaskNotFound();
        return tasks[taskId];
    }

    function getAgentIds(uint256 offset, uint256 limit) external view returns (uint256[] memory page) {
        if (offset >= allAgentIds.length) return new uint256[](0);
        uint256 end = offset + limit;
        if (end > allAgentIds.length) end = allAgentIds.length;
        page = new uint256[](end - offset);
        for (uint256 i = offset; i < end; i++) page[i - offset] = allAgentIds[i];
    }

    function getTaskIds(uint256 offset, uint256 limit) external view returns (uint256[] memory page) {
        if (offset >= allTaskIds.length) return new uint256[](0);
        uint256 end = offset + limit;
        if (end > allTaskIds.length) end = allTaskIds.length;
        page = new uint256[](end - offset);
        for (uint256 i = offset; i < end; i++) page[i - offset] = allTaskIds[i];
    }
}
