// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract AgentFunCore {
    enum TaskStatus {
        NONE,
        OPEN,
        COMPLETED,
        CANCELLED
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
        uint256 createdAt;
        bool active;
        uint256 taskCount;
        uint256 totalRevenue;
    }

    struct Task {
        uint256 id;
        uint256 agentId;
        address requester;
        uint256 fee;
        bytes32 promptRoot;
        bytes32 resultRoot;
        bytes32 computeHash;
        bytes32 daCommitment;
        TaskStatus status;
        uint256 createdAt;
        uint256 completedAt;
        uint8 rating;
    }

    uint256 public constant BPS = 10_000;
    uint256 public launchFee = 0.001 ether;
    uint256 public minTaskFee = 0.0005 ether;
    uint256 public protocolFeeBps = 200;
    uint256 public creatorFeeBps = 300;
    uint256 public nextAgentId = 1;
    uint256 public nextTaskId = 1;
    address public owner;

    mapping(uint256 => Agent) private agents;
    mapping(uint256 => Task) private tasks;
    mapping(uint256 => bool) public agentExists;
    mapping(uint256 => bool) public agentIdTokenUsed;
    mapping(uint256 => mapping(address => uint256)) public keyBalance;
    mapping(uint256 => uint256) public keySupply;
    mapping(uint256 => uint256) public agentReserve;
    mapping(address => uint256) public claimable;
    uint256[] private allAgentIds;
    uint256[] private allTaskIds;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event AgentLaunched(
        uint256 indexed agentId,
        address indexed creator,
        uint256 indexed agentIdTokenId,
        string name,
        string symbol,
        bytes32 metadataRoot,
        bytes32 memoryRoot
    );
    event AgentMemoryUpdated(uint256 indexed agentId, bytes32 previousRoot, bytes32 newRoot);
    event AgentStatusChanged(uint256 indexed agentId, bool active);
    event KeysBought(uint256 indexed agentId, address indexed buyer, uint256 keysOut, uint256 paid);
    event KeysSold(uint256 indexed agentId, address indexed seller, uint256 keysIn, uint256 received);
    event TaskCreated(uint256 indexed taskId, uint256 indexed agentId, address indexed requester, uint256 fee, bytes32 promptRoot);
    event TaskCompleted(
        uint256 indexed taskId,
        uint256 indexed agentId,
        bytes32 resultRoot,
        bytes32 computeHash,
        bytes32 daCommitment,
        bytes32 newMemoryRoot
    );
    event TaskRated(uint256 indexed taskId, uint8 rating);
    event RevenueClaimed(address indexed account, uint256 amount);

    error NotOwner();
    error NotAgentCreator();
    error AgentNotFound();
    error TaskNotFound();
    error InvalidInput();
    error InsufficientPayment();
    error AlreadyUsedAgentId();
    error InsufficientKeys();
    error TransferFailed();
    error InvalidTaskStatus();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyAgentCreator(uint256 agentId) {
        if (!agentExists[agentId]) revert AgentNotFound();
        if (agents[agentId].creator != msg.sender) revert NotAgentCreator();
        _;
    }

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidInput();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function setFees(uint256 newLaunchFee, uint256 newMinTaskFee, uint256 newProtocolFeeBps, uint256 newCreatorFeeBps)
        external
        onlyOwner
    {
        if (newProtocolFeeBps + newCreatorFeeBps > 2_000) revert InvalidInput();
        launchFee = newLaunchFee;
        minTaskFee = newMinTaskFee;
        protocolFeeBps = newProtocolFeeBps;
        creatorFeeBps = newCreatorFeeBps;
    }

    function launchAgent(
        string calldata name,
        string calldata symbol,
        string calldata category,
        uint256 agentIdTokenId,
        bytes32 metadataRoot,
        bytes32 memoryRoot,
        bytes32 capabilityHash
    ) external payable returns (uint256 agentId) {
        if (msg.value < launchFee) revert InsufficientPayment();
        if (bytes(name).length == 0 || bytes(name).length > 80) revert InvalidInput();
        if (bytes(symbol).length == 0 || bytes(symbol).length > 16) revert InvalidInput();
        if (bytes(category).length == 0 || bytes(category).length > 40) revert InvalidInput();
        if (agentIdTokenId == 0 || metadataRoot == bytes32(0) || memoryRoot == bytes32(0) || capabilityHash == bytes32(0)) {
            revert InvalidInput();
        }
        if (agentIdTokenUsed[agentIdTokenId]) revert AlreadyUsedAgentId();

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
            createdAt: block.timestamp,
            active: true,
            taskCount: 0,
            totalRevenue: 0
        });
        agentExists[agentId] = true;
        agentIdTokenUsed[agentIdTokenId] = true;
        allAgentIds.push(agentId);
        claimable[owner] += msg.value;

        emit AgentLaunched(agentId, msg.sender, agentIdTokenId, name, symbol, metadataRoot, memoryRoot);
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

    function buyKeys(uint256 agentId, uint256 keysOut) external payable returns (uint256 paid) {
        if (!agentExists[agentId]) revert AgentNotFound();
        if (keysOut == 0) revert InvalidInput();
        paid = getBuyPrice(agentId, keysOut);
        if (msg.value < paid) revert InsufficientPayment();

        uint256 creatorFee = (paid * creatorFeeBps) / BPS;
        uint256 protocolFee = (paid * protocolFeeBps) / BPS;
        uint256 reserveAmount = paid - creatorFee - protocolFee;
        keyBalance[agentId][msg.sender] += keysOut;
        keySupply[agentId] += keysOut;
        agentReserve[agentId] += reserveAmount;
        claimable[agents[agentId].creator] += creatorFee;
        claimable[owner] += protocolFee + (msg.value - paid);

        emit KeysBought(agentId, msg.sender, keysOut, paid);
    }

    function sellKeys(uint256 agentId, uint256 keysIn, uint256 minOut) external returns (uint256 payout) {
        if (!agentExists[agentId]) revert AgentNotFound();
        if (keysIn == 0) revert InvalidInput();
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

    function createTask(uint256 agentId, bytes32 promptRoot) external payable returns (uint256 taskId) {
        if (!agentExists[agentId]) revert AgentNotFound();
        if (!agents[agentId].active || promptRoot == bytes32(0)) revert InvalidInput();
        if (msg.value < minTaskFee) revert InsufficientPayment();
        taskId = nextTaskId++;
        tasks[taskId] = Task({
            id: taskId,
            agentId: agentId,
            requester: msg.sender,
            fee: msg.value,
            promptRoot: promptRoot,
            resultRoot: bytes32(0),
            computeHash: bytes32(0),
            daCommitment: bytes32(0),
            status: TaskStatus.OPEN,
            createdAt: block.timestamp,
            completedAt: 0,
            rating: 0
        });
        allTaskIds.push(taskId);
        agents[agentId].taskCount += 1;
        emit TaskCreated(taskId, agentId, msg.sender, msg.value, promptRoot);
    }

    function completeTask(
        uint256 taskId,
        bytes32 resultRoot,
        bytes32 computeHash,
        bytes32 daCommitment,
        bytes32 newMemoryRoot
    ) external {
        if (tasks[taskId].id == 0) revert TaskNotFound();
        Task storage task = tasks[taskId];
        if (task.status != TaskStatus.OPEN) revert InvalidTaskStatus();
        Agent storage agent = agents[task.agentId];
        if (msg.sender != agent.creator && msg.sender != task.requester) revert NotAgentCreator();
        if (resultRoot == bytes32(0) || computeHash == bytes32(0) || daCommitment == bytes32(0) || newMemoryRoot == bytes32(0)) {
            revert InvalidInput();
        }

        task.resultRoot = resultRoot;
        task.computeHash = computeHash;
        task.daCommitment = daCommitment;
        task.status = TaskStatus.COMPLETED;
        task.completedAt = block.timestamp;
        bytes32 previousRoot = agent.memoryRoot;
        agent.memoryRoot = newMemoryRoot;
        agent.totalRevenue += task.fee;
        claimable[agent.creator] += task.fee;

        emit AgentMemoryUpdated(task.agentId, previousRoot, newMemoryRoot);
        emit TaskCompleted(taskId, task.agentId, resultRoot, computeHash, daCommitment, newMemoryRoot);
    }

    function rateTask(uint256 taskId, uint8 rating) external {
        if (tasks[taskId].id == 0) revert TaskNotFound();
        Task storage task = tasks[taskId];
        if (task.requester != msg.sender || task.status != TaskStatus.COMPLETED) revert InvalidTaskStatus();
        if (rating == 0 || rating > 5) revert InvalidInput();
        task.rating = rating;
        emit TaskRated(taskId, rating);
    }

    function claimRevenue() external returns (uint256 amount) {
        amount = claimable[msg.sender];
        if (amount == 0) revert InvalidInput();
        claimable[msg.sender] = 0;
        (bool ok,) = msg.sender.call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit RevenueClaimed(msg.sender, amount);
    }

    function getBuyPrice(uint256 agentId, uint256 amount) public view returns (uint256) {
        uint256 supply = keySupply[agentId];
        uint256 total;
        for (uint256 i = 1; i <= amount; i += 1) {
            total += 0.0001 ether + ((supply + i) * 0.00002 ether);
        }
        return total;
    }

    function getSellPrice(uint256 agentId, uint256 amount) public view returns (uint256) {
        uint256 supply = keySupply[agentId];
        if (amount > supply) revert InvalidInput();
        uint256 total;
        for (uint256 i = 0; i < amount; i += 1) {
            total += 0.0001 ether + ((supply - i) * 0.00002 ether);
        }
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

    function getAllAgentIds() external view returns (uint256[] memory) {
        return allAgentIds;
    }

    function getAllTaskIds() external view returns (uint256[] memory) {
        return allTaskIds;
    }
}
