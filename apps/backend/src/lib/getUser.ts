import { auth } from "../utils/auth"
import prisma from "../lib/prisma";

export default async function getUser(req: any, res: any): Promise<any> {
    const session = await auth.api.getSession({
        headers: req.headers // passes request headers containing session
      });
      
      if (!session?.user) {
        return res.status(401).json({ error: 'Unauthorized', message: 'No valid session found in request headers.' });
      }
      const userId = session.user.id;

      const user = await prisma.user.findUnique({
        where: {
          id: userId
        }
      });
      if (!user) {
        res.status(400).json({ error: 'User not found' });
        return null;
      }
      return user;

}