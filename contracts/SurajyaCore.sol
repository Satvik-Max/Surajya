// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SurajyaCore {
    enum Status { Pending, InProgress, Resolved } // Added an InProgress state

    struct Grievance {
        uint256 id;
        string category;
        string locationHash;
        string detailsHash;
        address citizen;
        address assignedOfficial;
        Status status;
        uint8 escalationLevel;
        uint256 createdAt;
        uint256 updatedAt;
    }

    uint256 public grievanceCount;
    mapping(uint256 => Grievance) public grievances;
    
    address public oracle;
    address public owner;
    mapping(address => bool) public officials;

    event GrievanceCreated(uint256 indexed id, address indexed citizen);
    event GrievanceAssigned(uint256 indexed id, address indexed official);
    event GrievanceEscalated(uint256 indexed id, uint8 newLevel, address newOfficial);
    event GrievanceResolved(uint256 indexed id, address indexed official);

    modifier onlyOracle() {
        require(msg.sender == oracle, "Caller is not the oracle");
        _;
    }

    modifier onlyOfficial() {
        require(officials[msg.sender], "Caller is not an authorized official");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    constructor(address _oracle) {
        owner = msg.sender;
        oracle = _oracle;
    }

    function addOfficial(address _official) external onlyOwner {
        officials[_official] = true;
    }

    function createGrievance(string memory _category, string memory _locationHash, string memory _detailsHash) external {
        require(bytes(_category).length > 0, "Category is required");
        require(bytes(_locationHash).length > 0, "Location hash is required");

        grievanceCount++;
        grievances[grievanceCount] = Grievance({
            id: grievanceCount,
            category: _category,
            locationHash: _locationHash,
            detailsHash: _detailsHash,
            citizen: msg.sender,
            assignedOfficial: address(0),
            status: Status.Pending,
            escalationLevel: 1, // Start at level 1
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });
        emit GrievanceCreated(grievanceCount, msg.sender);
    }

    // Oracle calls this after off-chain OTP verification and official lookup
    function escalateGrievance(uint256 _grievanceId, address _newOfficial) external onlyOracle {
        require(_grievanceId > 0 && _grievanceId <= grievanceCount, "Invalid grievance ID");
        Grievance storage g = grievances[_grievanceId];
        require(g.status == Status.Pending || g.status == Status.InProgress, "Grievance not active");

        g.status = Status.Pending; // Reset to Pending for the new official
        g.escalationLevel++;
        g.assignedOfficial = _newOfficial;
        g.updatedAt = block.timestamp;

        emit GrievanceEscalated(_grievanceId, g.escalationLevel, _newOfficial);
        emit GrievanceAssigned(_grievanceId, _newOfficial);
    }

    // An official can mark a grievance as In Progress
    function acceptGrievance(uint256 _grievanceId) external onlyOfficial {
        Grievance storage g = grievances[_grievanceId];
        require(g.assignedOfficial == msg.sender, "Grievance not assigned to you");
        require(g.status == Status.Pending, "Grievance already in progress or resolved");
        g.status = Status.InProgress;
        g.updatedAt = block.timestamp;
    }

    // Official resolves the grievance. Off-chain system handles OTP check first.
    function resolveGrievance(uint256 _grievanceId) external onlyOfficial {
        Grievance storage g = grievances[_grievanceId];
        require(g.assignedOfficial == msg.sender, "Grievance not assigned to you");
        require(g.status == Status.InProgress, "Grievance not in progress");
        g.status = Status.Resolved;
        g.updatedAt = block.timestamp;
        emit GrievanceResolved(_grievanceId, msg.sender);
    }

    // Admin functions
    function changeOracle(address _newOracle) external onlyOwner {
        oracle = _newOracle;
    }
}