import { Router } from "express"
import { createLinkToken } from "../controllers/linkToken"
import { exchangePublicToken } from "../controllers/exchangePublicToken"
import { removeItem } from "../controllers/removeItem"
import { getAccounts } from "../controllers/getAccounts"
import { isBankConnected } from "../controllers/isBankConnected"
import { syncTransactions } from "../controllers/syncTransactions"
import { getTransactions } from "../controllers/getTransactions"
import { 
  categorizeTransaction, 
  getUncategorizedTransactions, 
  getUserCategories,
  getCategorizedTransactions,
  uncategorizeTransaction
} from "../controllers/categorizeTransaction"
import { getUserProgress, updateUserCurrency, markWalkthroughCompleted } from "../controllers/userProgress"
import { 
  getUserCategories as getManageableCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory
} from "../controllers/categoryManagement"
import { updateTransactions } from "../controllers/updateTransactions"
const router = Router();

router.post("/link/token/create", createLinkToken)
router.post("/exchange-public-token", exchangePublicToken)
router.post("/item/remove", removeItem)
router.get("/accounts", getAccounts)
router.get("/is-bank-connected", isBankConnected)
router.get("/transactions", getTransactions)
router.post("/transactions/sync", syncTransactions)
router.post("/transactions/updates", updateTransactions)

// Categorization routes
router.post("/transactions/categorize", categorizeTransaction)
router.post("/transactions/uncategorize", uncategorizeTransaction)
router.get("/transactions/uncategorized", getUncategorizedTransactions)
router.get("/categories", getUserCategories)
router.get("/transactions/categorized", getCategorizedTransactions)

// User progress routes
router.get("/user/progress", getUserProgress)
router.post("/user/currency", updateUserCurrency)
router.post("/user/walkthrough-complete", markWalkthroughCompleted)

// Category management routes
router.get("/categories/manage", getManageableCategories)
router.post("/categories", createCategory)
router.put("/categories/:categoryId", updateCategory)
router.delete("/categories/:categoryId", deleteCategory)

export default router