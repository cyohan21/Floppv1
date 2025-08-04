export const healthCheck = (req: any, res: any) => {
    return res.status(200).json({ status: 'ok' });
}

