import getUser from "../lib/getUser";

export const isBankConnected = async (req: any, res: any) => {
    try {
        const user = await getUser(req, res); // Checks if user is authenticated, error handling is done in getUser
        const isBankConnected = user.isBankConnected

        if (!isBankConnected) {
            return res.status(200).json({ isBankConnected: false });
        }
        return res.status(200).json({ isBankConnected: true })
    } catch (error) {
        return res.status(500).json({ error: 'Something went wrong with the request' });
    }
  }