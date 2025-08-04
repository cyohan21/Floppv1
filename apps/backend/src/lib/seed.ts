import prisma from './prisma'

export const DEFAULT_CATEGORIES = [
    'food',
    'transportation',
    'shopping',
    'entertainment',
    'rent',
    'travel',
    'school',
    'groceries',
    'car'
]

export const createDefaultCategoriesForUser = async (userId: string) => {
    const categoryPromises = DEFAULT_CATEGORIES.map(categoryName => 
        prisma.category.create({
            data: {
                name: categoryName,
                userId: userId
            }
        })
    )
    await Promise.all(categoryPromises)
}