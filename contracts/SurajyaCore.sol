// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SurajyaCore {
    enum Status { Pending, Resolved }

    struct Grievance {
        uint256 id;
        string category;
        string locationHash;
        string detailsHash;
        address citizen;
        Status status;
        uint256 createdAt;
        uint256 updatedAt;
    }

    uint256 public grievanceCount;
    mapping(uint256 => Grievance) public grievances;

    event GrievanceCreated(uint256 indexed id, address indexed citizen);
    event GrievanceResolved(uint256 indexed id, address indexed citizen);

    /// Citizen creates a grievance
    function createGrievance(
        string memory _category,
        string memory _locationHash,
        string memory _detailsHash
    ) external {
        grievanceCount++;
        grievances[grievanceCount] = Grievance({
            id: grievanceCount,
            category: _category,
            locationHash: _locationHash,
            detailsHash: _detailsHash,
            citizen: msg.sender,
            status: Status.Pending,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        emit GrievanceCreated(grievanceCount, msg.sender);
    }

    function resolveGrievance(uint256 _id) external {
    require(_id > 0 && _id <= grievanceCount, "Invalid grievance ID");

    Grievance storage g = grievances[_id];
    require(g.status == Status.Pending, "Already resolved");

    // In your prototype, any account acting as an "official" can resolve
    // Later you can restrict this with an officials mapping if needed
    g.status = Status.Resolved;
    g.updatedAt = block.timestamp;

    emit GrievanceResolved(_id, msg.sender);
}

}
