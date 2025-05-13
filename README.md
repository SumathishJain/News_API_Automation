# 🧪 Smart API Automation with Conditional Test Execution

This project demonstrates **smart and dynamic API test execution** using Postman, Newman, and a centralized strategy Google Sheet. Instead of manually toggling test cases, this approach automates execution based on **conditions**, **priority**, or **specific test case names** — making it ideal for regression, impact-based, or targeted testing.

---

## 📌 Key Features

- ✅ Data-driven testing using `test_data.json`
- 📊 Execution strategy controlled by Google Sheets
- 🧠 Intelligent filtering with conditions like `P1`, `Missing_Language`, or combinations like `P1&Valid_Request`
- ⚡ Supports `ExecuteAll` for full test runs
- 📝 Auto-creates a filtered strategy sheet (`filtered_test_strategy.csv`)
- 📁 HTML reports generated after each Newman run

---

## 🧩 Prerequisites

- Node.js installed
- Postman collection exported (e.g., `News_API_Automation.postman_collection.json`)
- Newman CLI installed (`npm install -g newman`)
- Access to Google Sheets with public CSV export link

Install project dependencies:

```bash
npm install --legacy-peer-deps
```

---

## 📂 Project Structure

```plaintext
├── execution.js                     # Main test execution logic
├── test_data.json                  # Contains input data for each test case
├── filtered_test_data.json         # Auto-generated filtered data used by Newman
├── News_API_Automation.postman_collection.json
├── reports/
│   └── Newman_Run_Report.html      # Generated HTML report
└── filtered_test_strategy.csv      # Filtered strategy with "yes"/"no" in Execute
```

---

## 🛠 How It Works

1. **Google Sheet as Strategy File**:
   - Columns:
     - `TestCaseName`
     - `Condition`
     - `Priority`
     - `Execute`
     - `TestConditionToBeExecuted`
     - `TestCaseToBeExecuted`
   - Leave `Execute` empty.
   - Populate either:
     - `TestConditionToBeExecuted` with values like `P1`, `Missing_Language`, `P1&Valid_Request`, or `ExecuteAll`
     - `TestCaseToBeExecuted` with actual test case names (comma-separated)

2. **Execution Logic**:
   - Fetches the sheet in CSV format via URL
   - Filters test cases based on given conditions
   - Marks filtered cases with `yes` in `filtered_test_strategy.csv`
   - Executes only selected test cases using Newman and generates HTML reports

---

## 🚀 How to Run

1. Modify your Google Sheet with required conditions or test case names
2. Update the `sheetURL` inside `execution.js` with the correct export link
3. Run the script:

```bash
node execution.js
```

---

## 📽 Demo Use Case

> "Let’s say a new deployment only impacts high-priority APIs and the `Missing_Language` test case.  
> Instead of running everything, just mention `P1, Missing_Language` in `TestConditionToBeExecuted`, and the system smartly picks and runs only relevant test cases."

---

## 📊 Output

- `filtered_test_data.json`: Inputs for selected test cases
- `filtered_test_strategy.csv`: Strategy with `Execute` column filled
- `Newman_Run_Report.html`: Execution summary with pass/fail stats

---

## 🙋‍♂️ Author

**Sumathish Jain**  
QA Engineer | API Automation | Smart Execution Design  
📎 [LinkedIn Profile](https://linkedin.com/in/sumathishjainbr)

---

## 📌 Notes

- Make sure the Google Sheet is publicly accessible or shared with appropriate access
- You can use `ExecuteAll` to run all test cases without condition filters
- Always test newly added cases using `ExecuteAll` once for validation
