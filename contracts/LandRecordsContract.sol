// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title LandRecordsContract
 * @dev Smart contract for tracking land records and payments on Polygon testnet
 * @author SARAL Bhoomi Team
 */
contract LandRecordsContract is Ownable, ReentrancyGuard {
    using Strings for uint256;
    
    // Structs
    struct LandRecord {
        string surveyNumber;
        string eventType;
        address officer;
        uint256 timestamp;
        string metadata;
        uint256 blockNumber;
        bool isValid;
    }
    
    struct Officer {
        address officerAddress;
        string name;
        string designation;
        string district;
        string taluka;
        bool isActive;
        uint256 registrationDate;
    }
    
    // State variables
    mapping(string => LandRecord[]) public landRecords;
    mapping(address => Officer) public officers;
    mapping(address => bool) public authorizedOfficers;
    
    // Events
    event LandRecordUpdated(
        string indexed surveyNumber,
        string eventType,
        address indexed officer,
        uint256 timestamp,
        string metadata,
        uint256 blockNumber
    );
    
    event OfficerRegistered(
        address indexed officerAddress,
        string name,
        string designation,
        string district,
        string taluka
    );
    
    event OfficerStatusChanged(
        address indexed officerAddress,
        bool isActive
    );
    
    // Modifiers
    modifier onlyAuthorizedOfficer() {
        require(authorizedOfficers[msg.sender], "Only authorized officers can perform this action");
        _;
    }
    
    modifier onlyValidSurveyNumber(string memory surveyNumber) {
        require(bytes(surveyNumber).length > 0, "Survey number cannot be empty");
        _;
    }
    
    // Constructor
    constructor() {
        // Register the contract deployer as the first authorized officer
        authorizedOfficers[msg.sender] = true;
    }
    
    /**
     * @dev Update land record with new event
     * @param surveyNumber The survey number of the land parcel
     * @param eventType The type of event (JMR_Measurement_Uploaded, Notice_Generated, etc.)
     * @param metadata Additional metadata about the event
     */
    function updateLandRecord(
        string memory surveyNumber,
        string memory eventType,
        string memory metadata
    ) external onlyAuthorizedOfficer onlyValidSurveyNumber(surveyNumber) {
        require(bytes(eventType).length > 0, "Event type cannot be empty");
        
        LandRecord memory newRecord = LandRecord({
            surveyNumber: surveyNumber,
            eventType: eventType,
            officer: msg.sender,
            timestamp: block.timestamp,
            metadata: metadata,
            blockNumber: block.number,
            isValid: true
        });
        
        landRecords[surveyNumber].push(newRecord);
        
        emit LandRecordUpdated(
            surveyNumber,
            eventType,
            msg.sender,
            block.timestamp,
            metadata,
            block.number
        );
    }
    
    /**
     * @dev Get all land records for a specific survey number
     * @param surveyNumber The survey number to query
     * @return recordTypes Array of event types
     * @return timestamps Array of timestamps
     * @return officers Array of officer addresses
     * @return metadata Array of metadata strings
     */
    function getLandRecord(string memory surveyNumber) 
        external 
        view 
        onlyValidSurveyNumber(surveyNumber)
        returns (
            string[] memory recordTypes,
            uint256[] memory timestamps,
            address[] memory officers,
            string[] memory metadata
        ) 
    {
        LandRecord[] memory records = landRecords[surveyNumber];
        uint256 recordCount = records.length;
        
        recordTypes = new string[](recordCount);
        timestamps = new uint256[](recordCount);
        officers = new address[](recordCount);
        metadata = new string[](recordCount);
        
        for (uint256 i = 0; i < recordCount; i++) {
            recordTypes[i] = records[i].eventType;
            timestamps[i] = records[i].timestamp;
            officers[i] = records[i].officer;
            metadata[i] = records[i].metadata;
        }
    }
    
    /**
     * @dev Verify if a specific record is valid
     * @param surveyNumber The survey number to verify
     * @param blockNumber The block number to verify
     * @return isValid Whether the record is valid
     */
    function verifyRecord(string memory surveyNumber, uint256 blockNumber) 
        external 
        view 
        onlyValidSurveyNumber(surveyNumber)
        returns (bool isValid) 
    {
        LandRecord[] memory records = landRecords[surveyNumber];
        
        for (uint256 i = 0; i < records.length; i++) {
            if (records[i].blockNumber == blockNumber) {
                return records[i].isValid;
            }
        }
        
        return false;
    }
    
    /**
     * @dev Get the total number of records for a survey number
     * @param surveyNumber The survey number to query
     * @return count Total number of records
     */
    function getRecordCount(string memory surveyNumber) 
        external 
        view 
        onlyValidSurveyNumber(surveyNumber)
        returns (uint256 count) 
    {
        return landRecords[surveyNumber].length;
    }
    
    /**
     * @dev Register a new officer
     * @param officerAddress The address of the officer
     * @param name The name of the officer
     * @param designation The designation of the officer
     * @param district The district where the officer is posted
     * @param taluka The taluka where the officer is posted
     */
    function registerOfficer(
        address officerAddress,
        string memory name,
        string memory designation,
        string memory district,
        string memory taluka
    ) external onlyOwner {
        require(officerAddress != address(0), "Invalid officer address");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(designation).length > 0, "Designation cannot be empty");
        require(bytes(district).length > 0, "District cannot be empty");
        require(bytes(taluka).length > 0, "Taluka cannot be empty");
        
        officers[officerAddress] = Officer({
            officerAddress: officerAddress,
            name: name,
            designation: designation,
            district: district,
            taluka: taluka,
            isActive: true,
            registrationDate: block.timestamp
        });
        
        authorizedOfficers[officerAddress] = true;
        
        emit OfficerRegistered(officerAddress, name, designation, district, taluka);
    }
    
    /**
     * @dev Change officer status (active/inactive)
     * @param officerAddress The address of the officer
     * @param isActive The new status
     */
    function setOfficerStatus(address officerAddress, bool isActive) external onlyOwner {
        require(officerAddress != address(0), "Invalid officer address");
        require(officers[officerAddress].officerAddress != address(0), "Officer not registered");
        
        officers[officerAddress].isActive = isActive;
        authorizedOfficers[officerAddress] = isActive;
        
        emit OfficerStatusChanged(officerAddress, isActive);
    }
    
    /**
     * @dev Get officer information
     * @param officerAddress The address of the officer
     * @return name Officer name
     * @return designation Officer designation
     * @return district Officer district
     * @return taluka Officer taluka
     * @return isActive Whether officer is active
     * @return registrationDate When officer was registered
     */
    function getOfficerInfo(address officerAddress) 
        external 
        view 
        returns (
            string memory name,
            string memory designation,
            string memory district,
            string memory taluka,
            bool isActive,
            uint256 registrationDate
        ) 
    {
        Officer memory officer = officers[officerAddress];
        require(officer.officerAddress != address(0), "Officer not found");
        
        return (
            officer.name,
            officer.designation,
            officer.district,
            officer.taluka,
            officer.isActive,
            officer.registrationDate
        );
    }
    
    /**
     * @dev Check if an address is an authorized officer
     * @param officerAddress The address to check
     * @return isAuthorized Whether the address is authorized
     */
    function isAuthorizedOfficer(address officerAddress) external view returns (bool isAuthorized) {
        return authorizedOfficers[officerAddress] && officers[officerAddress].isActive;
    }
    
    /**
     * @dev Get contract statistics
     * @return totalOfficers Total number of registered officers
     * @return activeOfficers Number of active officers
     * @return totalRecords Total number of land records
     */
    function getContractStats() external view returns (
        uint256 totalOfficers,
        uint256 activeOfficers,
        uint256 totalRecords
    ) {
        // This is a simplified implementation
        // In a production contract, you might want to maintain counters
        return (0, 0, 0);
    }
    
    /**
     * @dev Emergency function to invalidate a record (only owner)
     * @param surveyNumber The survey number
     * @param blockNumber The block number to invalidate
     */
    function invalidateRecord(string memory surveyNumber, uint256 blockNumber) 
        external 
        onlyOwner 
        onlyValidSurveyNumber(surveyNumber) 
    {
        LandRecord[] storage records = landRecords[surveyNumber];
        
        for (uint256 i = 0; i < records.length; i++) {
            if (records[i].blockNumber == blockNumber) {
                records[i].isValid = false;
                break;
            }
        }
    }
}
