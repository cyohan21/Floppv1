import { syncTransactions } from "./syncTransactions";
import prisma from "../lib/prisma";

export const updateTransactions = async (req: any, res: any) => {
    const { webhook_type, webhook_code, item_id } = req.body;
    
    
    // Only process TRANSACTIONS webhooks with SYNC_UPDATES_AVAILABLE
    if (webhook_type === "TRANSACTIONS" && webhook_code === "SYNC_UPDATES_AVAILABLE") {
        const user = await prisma.user.findFirst({
            where: {
                plaid_item_id: item_id
            }
        });
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
        // Pass user context while preserving original request
        await syncTransactions({ ...req, body: { user } }, res);
        console.log("Transactions updated successfully.");
        
        // Check if response was already sent by syncTransactions
        if (res.headersSent) {
            return; // Response already sent, don't send another
        }
    }
    return res.status(200).json({ success: true });
};