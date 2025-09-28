# JMR Search Functionality - Manual Testing Guide

## Prerequisites
- Backend server running on `http://localhost:3000`
- JMR data seeded in MongoDB
- API testing tool (curl, Postman, or browser)

## Available Search Endpoints

### 1. Get All JMR Records
**Endpoint:** `GET /api/jmr`
**Description:** Retrieve all JMR records with pagination

**curl command:**
```bash
curl -X GET "http://localhost:3000/api/jmr?page=1&limit=10"
```

**Response example:**
```json
{
  "success": true,
  "count": 4,
  "total": 4,
  "pagination": {
    "page": 1,
    "limit": 10,
    "pages": 1
  },
  "data": [
    {
      "_id": "...",
      "survey_number": "123/456",
      "owner_name": "राजेश पाटील",
      "village": "शिवाजीनगर",
      "taluka": "हवेली",
      "district": "पुणे",
      "status": "approved"
    }
  ]
}
```

### 2. Search by Survey Number
**Endpoint:** `GET /api/jmr?search={survey_number}`
**Description:** Search JMR records by survey number (case-insensitive)

**curl commands:**
```bash
# Search for survey containing "123"
curl -X GET "http://localhost:3000/api/jmr?search=123"

# Search for specific survey format
curl -X GET "http://localhost:3000/api/jmr?search=456"
```

### 3. Search by Owner Name
**Endpoint:** `GET /api/jmr?search={owner_name}`
**Description:** Search JMR records by owner name (case-insensitive)

**curl commands:**
```bash
# Search for owner containing "राज"
curl -X GET "http://localhost:3000/api/jmr?search=राज"

# Search for specific owner
curl -X GET "http://localhost:3000/api/jmr?search=पाटील"
```

### 4. Filter by Location

#### By District
**Endpoint:** `GET /api/jmr?district={district_name}`
**curl command:**
```bash
curl -X GET "http://localhost:3000/api/jmr?district=पुणे"
```

#### By Taluka
**Endpoint:** `GET /api/jmr?taluka={taluka_name}`
**curl command:**
```bash
curl -X GET "http://localhost:3000/api/jmr?taluka=हवेली"
```

#### By Village
**Endpoint:** `GET /api/jmr?village={village_name}`
**curl command:**
```bash
curl -X GET "http://localhost:3000/api/jmr?village=शिवाजीनगर"
```

### 5. Filter by Status
**Endpoint:** `GET /api/jmr?status={status}`
**Description:** Filter by JMR record status
**Valid statuses:** `draft`, `submitted`, `approved`, `rejected`

**curl commands:**
```bash
# Get approved records
curl -X GET "http://localhost:3000/api/jmr?status=approved"

# Get submitted records
curl -X GET "http://localhost:3000/api/jmr?status=submitted"
```

### 6. Combined Filters
**Description:** Combine multiple filters for advanced search

**curl commands:**
```bash
# District + Status
curl -X GET "http://localhost:3000/api/jmr?district=पुणे&status=approved"

# Village + Status
curl -X GET "http://localhost:3000/api/jmr?village=शिवाजीनगर&status=submitted"

# Search + District
curl -X GET "http://localhost:3000/api/jmr?search=123&district=पुणे"

# All filters combined
curl -X GET "http://localhost:3000/api/jmr?district=पुणे&taluka=हवेली&village=शिवाजीनगर&status=approved"
```

### 7. Pagination
**Endpoint:** `GET /api/jmr?page={page_number}&limit={records_per_page}`
**Description:** Control pagination for large result sets

**curl commands:**
```bash
# Page 1, 5 records per page
curl -X GET "http://localhost:3000/api/jmr?page=1&limit=5"

# Page 2, 10 records per page
curl -X GET "http://localhost:3000/api/jmr?page=2&limit=10"
```

### 8. Get Single Record by ID
**Endpoint:** `GET /api/jmr/{id}`
**Description:** Retrieve a specific JMR record by MongoDB ID

**curl command:**
```bash
# Replace {id} with actual MongoDB ID
curl -X GET "http://localhost:3000/api/jmr/{id}"
```

## Manual Testing Steps

### Step 1: Test Basic Listing
1. Open browser or API testing tool
2. Navigate to: `http://localhost:3000/api/jmr`
3. Verify you get a list of JMR records
4. Check pagination info in response

### Step 2: Test Search Functionality
1. **Survey Search:** Test `http://localhost:3000/api/jmr?search=123`
2. **Owner Search:** Test `http://localhost:3000/api/jmr?search=राज`
3. Verify results contain the search terms

### Step 3: Test Location Filters
1. **District:** `http://localhost:3000/api/jmr?district=पुणे`
2. **Taluka:** `http://localhost:3000/api/jmr?taluka=हवेली`
3. **Village:** `http://localhost:3000/api/jmr?village=शिवाजीनगर`
4. Verify all results match the filter criteria

### Step 4: Test Status Filters
1. **Approved:** `http://localhost:3000/api/jmr?status=approved`
2. **Submitted:** `http://localhost:3000/api/jmr?status=submitted`
3. Verify status field matches in all results

### Step 5: Test Combined Filters
1. **District + Status:** `http://localhost:3000/api/jmr?district=पुणे&status=approved`
2. **Search + Location:** `http://localhost:3000/api/jmr?search=123&district=पुणे`
3. Verify all filter conditions are applied

### Step 6: Test Pagination
1. **Page 1:** `http://localhost:3000/api/jmr?page=1&limit=2`
2. **Page 2:** `http://localhost:3000/api/jmr?page=2&limit=2`
3. Verify different records on each page

### Step 7: Test Single Record
1. Get an ID from the list response
2. Test: `http://localhost:3000/api/jmr/{actual_id}`
3. Verify single record details are returned

## Expected Results

Based on the seeded data, you should see:

- **Total Records:** 4 JMR records
- **Districts:** पुणे (Pune)
- **Talukas:** हवेली (Haveli)
- **Villages:** शिवाजीनगर, किरकटवाडी, लोणीकंद, पिंपळे सौदागर
- **Statuses:** approved (2 records), submitted (2 records)
- **Survey Numbers:** Various formats like "123/456", "789/012", etc.
- **Owner Names:** Marathi names containing "राज", "पाटील", etc.

## Troubleshooting

### No Results Found
- Verify data is seeded: Check MongoDB connection
- Check for typos in search terms
- Verify URL encoding for special characters

### Server Errors
- Ensure backend server is running on port 3000
- Check console logs for detailed error messages
- Verify MongoDB connection is active

### Unexpected Results
- Check case sensitivity (search is case-insensitive)
- Verify filter combinations are valid
- Check pagination parameters