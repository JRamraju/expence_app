# Firestore Schema

Top-level per user:
- `users/{uid}`
  - `accounts/{hand|sbi|canara}`: `{name, balance, limit}`
  - `transactions/{txId}`: `{id,type,amount,reason,category,account,date,time,createdAt}`
  - `daily_summary/{YYYY-MM-DD}`: `{total_income,total_expense,savings,transactions[]}`
  - `categories/{categoryId}`: `{name}`
  - `user_profile/main`: `{name,company,monthlyIncome}`
  - `settings/general`: `{blockOverLimit}`
  - `retention_flags/old_data`: `{hasOldData,threshold,checkedAt}`

Transaction IDs follow pattern:
- Expense: `ex1`, `ex2`, ... (can be added as display id in client)
- Income: `in1`, `in2`, ...

Spark mode uses Firestore client-side transactions for atomic updates to account balances and daily summaries.
