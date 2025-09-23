// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title DataIntegrityContract
 * @dev Contract to track sequential land acquisition workflow on blockchain
 * 1. Land Records Added → Initial block
 * 2. Payment Slip Generated → Compensation update
 * 3. Ownership Transfer → Final ownership update
 */
contract DataIntegrityContract is Ownable, ReentrancyGuard {
    
    // Enum for workflow stages
    enum WorkflowStage {
        NotStarted,      // 0
        LandRecordsAdded, // 1
        PaymentGenerated, // 2
        OwnershipTransferred // 3
    }
    
    // Struct for survey workflow data
    struct SurveyWorkflow {
        string surveyNumber;
        string landRecordsHash;
        string paymentHash;
        string ownershipHash;
        WorkflowStage currentStage;
        uint256 landRecordsTimestamp;
        uint256 paymentTimestamp;
        uint256 ownershipTimestamp;
        string projectName;
        string landownerName;
        uint256 compensationAmount;
        bool isCompleted;
    }
    
    // Mapping: survey number => workflow data
    mapping(string => SurveyWorkflow) public surveyWorkflows;
    
    // Mapping: survey number => exists
    mapping(string => bool) public surveyExists;
    
    // Events
    event LandRecordsAdded(string indexed surveyNumber, string dataHash, string projectName, string landownerName, uint256 timestamp);
    event PaymentGenerated(string indexed surveyNumber, string paymentHash, uint256 compensationAmount, uint256 timestamp);
    event OwnershipTransferred(string indexed surveyNumber, string ownershipHash, string projectName, uint256 timestamp);
    event WorkflowCompleted(string indexed surveyNumber, uint256 timestamp);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Step 1: Add land records and create initial block
     * @param surveyNumber The survey number
     * @param dataHash Hash of land records data
     * @param projectName Name of the project
     * @param landownerName Name of the landowner
     * @param metadata Additional metadata as JSON string
     */
    function addLandRecords(
        string memory surveyNumber,
        string memory dataHash,
        string memory projectName,
        string memory landownerName,
        string memory metadata
    ) external onlyOwner nonReentrant {
        require(bytes(surveyNumber).length > 0, "Survey number cannot be empty");
        require(bytes(dataHash).length > 0, "Data hash cannot be empty");
        require(bytes(projectName).length > 0, "Project name cannot be empty");
        require(!surveyExists[surveyNumber], "Survey already exists");
        
        // Create new workflow entry
        surveyWorkflows[surveyNumber] = SurveyWorkflow({
            surveyNumber: surveyNumber,
            landRecordsHash: dataHash,
            paymentHash: "",
            ownershipHash: "",
            currentStage: WorkflowStage.LandRecordsAdded,
            landRecordsTimestamp: block.timestamp,
            paymentTimestamp: 0,
            ownershipTimestamp: 0,
            projectName: projectName,
            landownerName: landownerName,
            compensationAmount: 0,
            isCompleted: false
        });
        
        surveyExists[surveyNumber] = true;
        
        emit LandRecordsAdded(surveyNumber, dataHash, projectName, landownerName, block.timestamp);
    }
    
    /**
     * @dev Step 2: Update with payment slip generation
     * @param surveyNumber The survey number
     * @param paymentHash Hash of payment data
     * @param compensationAmount Amount of compensation
     * @param metadata Additional payment metadata
     */
    function updatePaymentGenerated(
        string memory surveyNumber,
        string memory paymentHash,
        uint256 compensationAmount,
        string memory metadata
    ) external onlyOwner nonReentrant {
        require(surveyExists[surveyNumber], "Survey does not exist");
        require(bytes(paymentHash).length > 0, "Payment hash cannot be empty");
        require(compensationAmount > 0, "Compensation amount must be greater than 0");
        
        SurveyWorkflow storage workflow = surveyWorkflows[surveyNumber];
        require(workflow.currentStage == WorkflowStage.LandRecordsAdded, "Must add land records first");
        
        // Update workflow with payment information
        workflow.paymentHash = paymentHash;
        workflow.compensationAmount = compensationAmount;
        workflow.currentStage = WorkflowStage.PaymentGenerated;
        workflow.paymentTimestamp = block.timestamp;
        
        emit PaymentGenerated(surveyNumber, paymentHash, compensationAmount, block.timestamp);
    }
    
    /**
     * @dev Step 3: Complete workflow with ownership transfer
     * @param surveyNumber The survey number
     * @param ownershipHash Hash of ownership transfer data
     * @param metadata Additional ownership metadata
     */
    function completeOwnershipTransfer(
        string memory surveyNumber,
        string memory ownershipHash,
        string memory metadata
    ) external onlyOwner nonReentrant {
        require(surveyExists[surveyNumber], "Survey does not exist");
        require(bytes(ownershipHash).length > 0, "Ownership hash cannot be empty");
        
        SurveyWorkflow storage workflow = surveyWorkflows[surveyNumber];
        require(workflow.currentStage == WorkflowStage.PaymentGenerated, "Must generate payment first");
        
        // Complete the workflow
        workflow.ownershipHash = ownershipHash;
        workflow.currentStage = WorkflowStage.OwnershipTransferred;
        workflow.ownershipTimestamp = block.timestamp;
        workflow.isCompleted = true;
        
        emit OwnershipTransferred(surveyNumber, ownershipHash, workflow.projectName, block.timestamp);
        emit WorkflowCompleted(surveyNumber, block.timestamp);
    }
    
    /**
     * @dev Get complete workflow data for a survey number
     * @param surveyNumber The survey number
     * @return Complete workflow data
     */
    function getSurveyWorkflow(string memory surveyNumber) external view returns (
        string memory surveyNum,
        string memory landRecordsHash,
        string memory paymentHash,
        string memory ownershipHash,
        WorkflowStage currentStage,
        uint256 landRecordsTimestamp,
        uint256 paymentTimestamp,
        uint256 ownershipTimestamp,
        string memory projectName,
        string memory landownerName,
        uint256 compensationAmount,
        bool isCompleted
    ) {
        require(surveyExists[surveyNumber], "Survey does not exist");
        
        SurveyWorkflow memory workflow = surveyWorkflows[surveyNumber];
        return (
            workflow.surveyNumber,
            workflow.landRecordsHash,
            workflow.paymentHash,
            workflow.ownershipHash,
            workflow.currentStage,
            workflow.landRecordsTimestamp,
            workflow.paymentTimestamp,
            workflow.ownershipTimestamp,
            workflow.projectName,
            workflow.landownerName,
            workflow.compensationAmount,
            workflow.isCompleted
        );
    }
    
    /**
     * @dev Get current stage of a survey workflow
     * @param surveyNumber The survey number
     * @return Current workflow stage
     */
    function getWorkflowStage(string memory surveyNumber) external view returns (WorkflowStage) {
        require(surveyExists[surveyNumber], "Survey does not exist");
        return surveyWorkflows[surveyNumber].currentStage;
    }
    
    /**
     * @dev Check if survey workflow is completed
     * @param surveyNumber The survey number
     * @return True if workflow is completed
     */
    function isWorkflowCompleted(string memory surveyNumber) external view returns (bool) {
        require(surveyExists[surveyNumber], "Survey does not exist");
        return surveyWorkflows[surveyNumber].isCompleted;
    }
    
    /**
     * @dev Get project name for a survey
     * @param surveyNumber The survey number
     * @return Project name
     */
    function getProjectName(string memory surveyNumber) external view returns (string memory) {
        require(surveyExists[surveyNumber], "Survey does not exist");
        return surveyWorkflows[surveyNumber].projectName;
    }
    
    /**
     * @dev Get compensation amount for a survey
     * @param surveyNumber The survey number
     * @return Compensation amount
     */
    function getCompensationAmount(string memory surveyNumber) external view returns (uint256) {
        require(surveyExists[surveyNumber], "Survey does not exist");
        return surveyWorkflows[surveyNumber].compensationAmount;
    }
    
    /**
     * @dev Emergency function to withdraw any accidentally sent ETH
     * Only owner can call this
     */
    function withdrawETH() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "ETH withdrawal failed");
    }
    
    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {}
}
