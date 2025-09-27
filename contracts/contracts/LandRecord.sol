// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/access/AccessControl.sol";

contract LandRecord is AccessControl {
    bytes32 public constant OFFICER_ROLE = keccak256("OFFICER_ROLE");

    event AuthorisedChange(
        bytes32 indexed recordId,
        address indexed officer,
        string  field,
        string  oldVal,
        string  newVal,
        uint256 ts
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function authorisedUpdate(
        bytes32 _recordId,
        string calldata _field,
        string calldata _oldVal,
        string calldata _newVal
    ) external onlyRole(OFFICER_ROLE) {
        emit AuthorisedChange(_recordId, msg.sender, _field, _oldVal, _newVal, block.timestamp);
    }
}