// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title LandRecordsContract
 * @dev Enhanced smart contract for tracking land records with comprehensive hash generation
 * @author SARAL Bhoomi Team
 */
contract LandRecordsContract is Ownable, ReentrancyGuard {
    using Strings for uint256;
    
    // Constructor
    constructor() Ownable(msg.sender) {
        // Initialize contract with deployer as owner
        _initializeDeployer();
    }
    
    // Structs
    struct LandRecord {
        string surveyNumber;
        string eventType;
        address officer;
        uint256 timestamp;
        string metadata;
        uint256 blockNumber;
        bool isValid;
        string previousHash;
        string currentHash;
        uint256 nonce;
        string dataHash; // Hash of all survey number related data
    }
    
    struct SurveyData {
        string surveyNumber;
        string ownerId;
        string landType;
        string landArea;
        string location;
        string projectDetails;
        uint256 lastUpdated;
        bool isActive;
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
    
    // NEW: Timeline Event struct for de-land inspired features
    struct TimelineEvent {
        string eventType;           // AwardDeclared, Compensated, OwnershipUpdated, etc.
        string ownerId;             // Current owner at time of event
        string surveyNumber;        // Survey number
        string landType;            // Land classification
        string details;             // Detailed description
        uint256 timestamp;          // When event occurred
        address officer;            // Officer who recorded event
        string eventHash;           // Hash of this specific event
        string previousHash;        // Hash of previous event
        uint256 eventIndex;         // Index in timeline
        bool isValid;               // Event validity status
    }
    
    // NEW: Integrity verification struct
    struct IntegrityCheck {
        string surveyNumber;
        string databaseHash;
        string blockchainHash;
        uint256 lastChecked;
        bool isCompromised;
        string compromiseReason;
    }
    
    // State variables
    mapping(string => LandRecord[]) public landRecords;
    mapping(string => SurveyData) public surveyData;
    mapping(address => Officer) public officers;
    mapping(address => bool) public authorizedOfficers;
    mapping(string => string) public surveyDataHashes; // Current hash for each survey number
    
    // NEW: Timeline and integrity state variables
    mapping(string => TimelineEvent[]) public surveyTimeline; // Timeline for each survey
    mapping(string => uint256) public surveyTimelineCount;   // Count of timeline events
    mapping(string => string) public surveyCurrentTimelineHash; // Current timeline hash
    mapping(string => bool) public surveyIntegrityStatus;   // Integrity verification status
    mapping(string => IntegrityCheck) public integrityChecks; // Integrity check results
    
    // Events
    event LandRecordUpdated(
        string indexed surveyNumber,
        string eventType,
        address indexed officer,
        uint256 timestamp,
        string metadata,
        uint256 blockNumber,
        string dataHash
    );
    
    event SurveyDataUpdated(
        string indexed surveyNumber,
        string ownerId,
        string landType,
        string dataHash,
        uint256 timestamp
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
    
    // NEW: Events for timeline and integrity
    event TimelineEventAdded(
        string indexed surveyNumber,
        string eventType,
        string ownerId,
        uint256 timestamp,
        string eventHash,
        uint256 eventIndex
    );
    
    event IntegrityCheckPerformed(
        string indexed surveyNumber,
        bool isCompromised,
        string reason
    );
    
    event SurveyBlockCreated(
        string indexed surveyNumber,
        string initialHash,
        uint256 timestamp
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
    
    // Register the contract deployer as the first authorized officer
    function _initializeDeployer() internal {
        authorizedOfficers[msg.sender] = true;
    }
    
    /**
     * @dev Generate comprehensive hash from all survey number related data
     * @param surveyNumber The survey number
     * @param ownerId Owner ID
     * @param landType Type of land
     * @param landArea Area of land
     * @param location Location details
     * @param projectDetails Project information
     * @param timestamp Current timestamp
     * @return dataHash The generated hash
     */
    function generateSurveyDataHash(
        string memory surveyNumber,
        string memory ownerId,
        string memory landType,
        string memory landArea,
        string memory location,
        string memory projectDetails,
        uint256 timestamp
    ) public pure returns (string memory dataHash) {
        // Combine all data into a single string for hashing
        string memory combinedData = string(abi.encodePacked(
            surveyNumber,
            ownerId,
            landType,
            landArea,
            location,
            projectDetails,
            timestamp.toString()
        ));
        
        // Generate hash (in production, use keccak256)
        return _generateHash(combinedData);
    }
    
    /**
     * @dev Update land record with comprehensive data and new hash
     * @param surveyNumber The survey number of the land parcel
     * @param eventType The type of event (JMR_Measurement_Uploaded, Notice_Generated, etc.)
     * @param metadata Additional metadata about the event
     * @param ownerId Owner ID
     * @param landType Type of land
     * @param landArea Area of land
     * @param location Location details
     * @param projectDetails Project information
     */
    function updateLandRecord(
        string memory surveyNumber,
        string memory eventType,
        string memory metadata,
        string memory ownerId,
        string memory landType,
        string memory landArea,
        string memory location,
        string memory projectDetails
    ) external onlyAuthorizedOfficer onlyValidSurveyNumber(surveyNumber) {
        require(bytes(eventType).length > 0, "Event type cannot be empty");
        
        uint256 timestamp = block.timestamp;
        
        // Generate new data hash
        string memory newDataHash = generateSurveyDataHash(
            surveyNumber,
            ownerId,
            landType,
            landArea,
            location,
            projectDetails,
            timestamp
        );
        
        // Get previous hash for this survey number
        string memory previousHash = surveyDataHashes[surveyNumber];
        if (bytes(previousHash).length == 0) {
            previousHash = "0";
        }
        
        // Generate current hash
        string memory currentHash = _generateHash(string(abi.encodePacked(
            surveyNumber,
            eventType,
            msg.sender,
            timestamp.toString(),
            newDataHash,
            previousHash
        )));
        
        // Create new record
        LandRecord memory newRecord = LandRecord({
            surveyNumber: surveyNumber,
            eventType: eventType,
            officer: msg.sender,
            timestamp: timestamp,
            metadata: metadata,
            blockNumber: block.number,
            isValid: true,
            previousHash: previousHash,
            currentHash: currentHash,
            nonce: block.number,
            dataHash: newDataHash
        });
        
        landRecords[surveyNumber].push(newRecord);
        
        // Update survey data
        surveyData[surveyNumber] = SurveyData({
            surveyNumber: surveyNumber,
            ownerId: ownerId,
            landType: landType,
            landArea: landArea,
            location: location,
            projectDetails: projectDetails,
            lastUpdated: timestamp,
            isActive: true
        });
        
        // Update current hash for this survey number
        surveyDataHashes[surveyNumber] = currentHash;
        
        emit LandRecordUpdated(
            surveyNumber,
            eventType,
            msg.sender,
            timestamp,
            metadata,
            block.number,
            newDataHash
        );
        
        emit SurveyDataUpdated(
            surveyNumber,
            ownerId,
            landType,
            newDataHash,
            timestamp
        );
    }
    
    /**
     * @dev Get all land records for a specific survey number with timeline
     * @param surveyNumber The survey number to query
     * @return recordTypes Array of event types
     * @return timestamps Array of timestamps
     * @return officers Array of officer addresses
     * @return metadata Array of metadata strings
     * @return dataHashes Array of data hashes
     * @return currentHashes Array of current hashes
     */
    function getLandRecord(string memory surveyNumber) 
        external 
        view 
        onlyValidSurveyNumber(surveyNumber)
        returns (
            string[] memory recordTypes,
            uint256[] memory timestamps,
            address[] memory officers,
            string[] memory metadata,
            string[] memory dataHashes,
            string[] memory currentHashes
        ) 
    {
        LandRecord[] memory records = landRecords[surveyNumber];
        uint256 recordCount = records.length;
        
        recordTypes = new string[](recordCount);
        timestamps = new uint256[](recordCount);
        officers = new address[](recordCount);
        metadata = new string[](recordCount);
        dataHashes = new string[](recordCount);
        currentHashes = new string[](recordCount);
        
        for (uint256 i = 0; i < recordCount; i++) {
            recordTypes[i] = records[i].eventType;
            timestamps[i] = records[i].timestamp;
            officers[i] = records[i].officer;
            metadata[i] = records[i].metadata;
            dataHashes[i] = records[i].dataHash;
            currentHashes[i] = records[i].currentHash;
        }
    }
    
    /**
     * @dev Get current survey data for a survey number
     * @param surveyNumber The survey number to query
     * @return data The current survey data
     */
    function getSurveyData(string memory surveyNumber) 
        external 
        view 
        onlyValidSurveyNumber(surveyNumber)
        returns (SurveyData memory data) 
    {
        return surveyData[surveyNumber];
    }
    
    /**
     * @dev Get the current hash for a survey number
     * @param surveyNumber The survey number to query
     * @return currentHash The current hash
     */
    function getCurrentHash(string memory surveyNumber) 
        external 
        view 
        onlyValidSurveyNumber(surveyNumber)
        returns (string memory currentHash) 
    {
        return surveyDataHashes[surveyNumber];
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
     * @return totalSurveys Total number of unique survey numbers
     */
    function getContractStats() external view returns (
        uint256 totalOfficers,
        uint256 activeOfficers,
        uint256 totalRecords,
        uint256 totalSurveys
    ) {
        // This is a simplified implementation
        // In a production contract, you might want to maintain counters
        return (0, 0, 0, 0);
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
    
    /**
     * @dev Internal hash generation function
     * @param data The data to hash
     * @return hash The generated hash
     */
    function _generateHash(string memory data) internal pure returns (string memory hash) {
        // Simple hash function for demo purposes
        // In production, use keccak256 or similar cryptographic hash
        uint256 hashValue = 0;
        for (uint256 i = 0; i < bytes(data).length; i++) {
            hashValue = ((hashValue << 5) + hashValue) + uint8(bytes(data)[i]);
        }
        return hashValue.toHexString();
    }
    
    // ===== NEW: De-Land Inspired Timeline Functions =====
    
    /**
     * @dev Create initial survey block with all current data
     * @param surveyNumber The survey number
     * @param jmrData JMR measurement data
     * @param awardData Award and compensation data
     * @param landRecordData Land record details
     * @param ownerId Current owner ID
     * @param landType Land classification
     */
    function createSurveyBlock(
        string memory surveyNumber,
        string memory jmrData,
        string memory awardData,
        string memory landRecordData,
        string memory ownerId,
        string memory landType
    ) external onlyAuthorizedOfficer onlyValidSurveyNumber(surveyNumber) {
        require(bytes(surveyCurrentTimelineHash[surveyNumber]).length == 0, "Survey block already exists");
        
        // Generate initial hash from all data
        string memory initialHash = _generateHash(string(abi.encodePacked(
            surveyNumber,
            jmrData,
            awardData,
            landRecordData,
            ownerId,
            landType,
            block.timestamp.toString()
        )));
        
        // Create initial timeline event
        TimelineEvent memory initialEvent = TimelineEvent({
            eventType: "SurveyBlockCreated",
            ownerId: ownerId,
            surveyNumber: surveyNumber,
            landType: landType,
            details: "Initial survey block created with all land data",
            timestamp: block.timestamp,
            officer: msg.sender,
            eventHash: initialHash,
            previousHash: "0",
            eventIndex: 0,
            isValid: true
        });
        
        // Store in timeline
        surveyTimeline[surveyNumber].push(initialEvent);
        surveyTimelineCount[surveyNumber] = 1;
        surveyCurrentTimelineHash[surveyNumber] = initialHash;
        surveyIntegrityStatus[surveyNumber] = true;
        
        emit SurveyBlockCreated(surveyNumber, initialHash, block.timestamp);
        emit TimelineEventAdded(surveyNumber, "SurveyBlockCreated", ownerId, block.timestamp, initialHash, 0);
    }
    
    /**
     * @dev Add new timeline event for survey changes
     * @param surveyNumber The survey number
     * @param eventType Type of event (AwardDeclared, Compensated, etc.)
     * @param ownerId Current owner ID
     * @param landType Land classification
     * @param details Detailed description of the event
     */
    function addTimelineEvent(
        string memory surveyNumber,
        string memory eventType,
        string memory ownerId,
        string memory landType,
        string memory details
    ) external onlyAuthorizedOfficer onlyValidSurveyNumber(surveyNumber) {
        require(bytes(surveyCurrentTimelineHash[surveyNumber]).length > 0, "Survey block does not exist");
        require(bytes(eventType).length > 0, "Event type cannot be empty");
        
        // Get previous hash
        string memory previousHash = surveyCurrentTimelineHash[surveyNumber];
        
        // Generate new event hash
        string memory newEventHash = _generateHash(string(abi.encodePacked(
            surveyNumber,
            eventType,
            ownerId,
            landType,
            details,
            previousHash,
            block.timestamp.toString()
        )));
        
        // Create new timeline event
        uint256 eventIndex = surveyTimelineCount[surveyNumber];
        TimelineEvent memory newEvent = TimelineEvent({
            eventType: eventType,
            ownerId: ownerId,
            surveyNumber: surveyNumber,
            landType: landType,
            details: details,
            timestamp: block.timestamp,
            officer: msg.sender,
            eventHash: newEventHash,
            previousHash: previousHash,
            eventIndex: eventIndex,
            isValid: true
        });
        
        // Store in timeline
        surveyTimeline[surveyNumber].push(newEvent);
        surveyTimelineCount[surveyNumber] = eventIndex + 1;
        surveyCurrentTimelineHash[surveyNumber] = newEventHash;
        
        emit TimelineEventAdded(surveyNumber, eventType, ownerId, block.timestamp, newEventHash, eventIndex);
    }
    
    /**
     * @dev Get complete timeline for a survey number
     * @param surveyNumber The survey number
     * @return eventTypes Array of event types
     * @return ownerIds Array of owner IDs
     * @return landTypes Array of land types
     * @return details Array of event details
     * @return timestamps Array of timestamps
     * @return officers Array of officer addresses
     * @return eventHashes Array of event hashes
     * @return eventIndexes Array of event indexes
     */
    function getSurveyTimeline(string memory surveyNumber) 
        external 
        view 
        onlyValidSurveyNumber(surveyNumber)
        returns (
            string[] memory eventTypes,
            string[] memory ownerIds,
            string[] memory landTypes,
            string[] memory details,
            uint256[] memory timestamps,
            address[] memory officers,
            string[] memory eventHashes,
            uint256[] memory eventIndexes
        ) 
    {
        TimelineEvent[] memory timeline = surveyTimeline[surveyNumber];
        uint256 eventCount = timeline.length;
        
        eventTypes = new string[](eventCount);
        ownerIds = new string[](eventCount);
        landTypes = new string[](eventCount);
        details = new string[](eventCount);
        timestamps = new uint256[](eventCount);
        officers = new address[](eventCount);
        eventHashes = new string[](eventCount);
        eventIndexes = new uint256[](eventCount);
        
        for (uint256 i = 0; i < eventCount; i++) {
            eventTypes[i] = timeline[i].eventType;
            ownerIds[i] = timeline[i].ownerId;
            landTypes[i] = timeline[i].landType;
            details[i] = timeline[i].details;
            timestamps[i] = timeline[i].timestamp;
            officers[i] = timeline[i].officer;
            eventHashes[i] = timeline[i].eventHash;
            eventIndexes[i] = timeline[i].eventIndex;
        }
    }
    
    /**
     * @dev Verify survey integrity by comparing database hash with blockchain hash
     * @param surveyNumber The survey number
     * @param databaseHash Hash from database
     * @return isCompromised Whether data integrity is compromised
     * @return reason Reason for compromise if any
     */
    function verifySurveyIntegrity(
        string memory surveyNumber,
        string memory databaseHash
    ) external onlyAuthorizedOfficer onlyValidSurveyNumber(surveyNumber) returns (bool isCompromised, string memory reason) {
        string memory blockchainHash = surveyCurrentTimelineHash[surveyNumber];
        
        if (bytes(blockchainHash).length == 0) {
            isCompromised = true;
            reason = "Survey block does not exist on blockchain";
        } else if (keccak256(abi.encodePacked(databaseHash)) != keccak256(abi.encodePacked(blockchainHash))) {
            isCompromised = true;
            reason = "Database hash does not match blockchain hash - data may be tampered";
        } else {
            isCompromised = false;
            reason = "Data integrity verified - no tampering detected";
        }
        
        // Store integrity check result
        integrityChecks[surveyNumber] = IntegrityCheck({
            surveyNumber: surveyNumber,
            databaseHash: databaseHash,
            blockchainHash: blockchainHash,
            lastChecked: block.timestamp,
            isCompromised: isCompromised,
            compromiseReason: reason
        });
        
        // Update survey integrity status
        surveyIntegrityStatus[surveyNumber] = !isCompromised;
        
        emit IntegrityCheckPerformed(surveyNumber, isCompromised, reason);
        
        return (isCompromised, reason);
    }
    
    /**
     * @dev Get current timeline hash for a survey number
     * @param surveyNumber The survey number
     * @return currentHash Current timeline hash
     */
    function getCurrentTimelineHash(string memory surveyNumber) 
        external 
        view 
        onlyValidSurveyNumber(surveyNumber)
        returns (string memory currentHash) 
    {
        return surveyCurrentTimelineHash[surveyNumber];
    }
    
    /**
     * @dev Get integrity status for a survey number
     * @param surveyNumber The survey number
     * @return isIntegrityValid Whether survey integrity is valid
     * @return lastChecked When integrity was last checked
     * @return compromiseReason Reason for compromise if any
     */
    function getSurveyIntegrityStatus(string memory surveyNumber) 
        external 
        view 
        onlyValidSurveyNumber(surveyNumber)
        returns (
            bool isIntegrityValid,
            uint256 lastChecked,
            string memory compromiseReason
        ) 
    {
        IntegrityCheck memory check = integrityChecks[surveyNumber];
        return (
            surveyIntegrityStatus[surveyNumber],
            check.lastChecked,
            check.compromiseReason
        );
    }
    
    /**
     * @dev Get timeline count for a survey number
     * @param surveyNumber The survey number
     * @return count Number of timeline events
     */
    function getTimelineCount(string memory surveyNumber) 
        external 
        view 
        onlyValidSurveyNumber(surveyNumber)
        returns (uint256 count) 
    {
        return surveyTimelineCount[surveyNumber];
    }
}
