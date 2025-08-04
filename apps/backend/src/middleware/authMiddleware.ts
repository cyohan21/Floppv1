import { auth } from "../utils/auth"
import { RequestHandler } from "express"
 
export const requireAuth: RequestHandler = async (req, res, next) => {
    try {
        const session = await auth.api.getSession({
            headers: req.headers as any
        })

        if (!session?.user) {
            const error = new Error("Unauthorized");
            (error as any).status = 401
            return next(error)
        }

        (req as any).user = session.user
        next();
    }
    catch (err) {
        const error = new Error("Invalid session");
        (error as any).status = 401
        return next(error)
    }
}
