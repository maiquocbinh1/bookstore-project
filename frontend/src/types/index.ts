export interface Review {
    review_id: number;
    book_id: number;
    user_id: number;
    rating: number;
    comment: string;
    created_at: string;
    full_name?: string;
    user_name?: string;
}

export interface Book {
    book_id: number;
    id?: number;
    isbn: string;
    title: string;
    author: string;
    price: number;
    image_url: string;
    stock_quantity: number;
    category_name?: string;
    description?: string;
    publisher?: string;
    published_year?: number;
    publication_year?: number;
    pages?: number;
    language?: string;
    reviews?: Review[];
}

export interface Category {
    category_id: number;
    id?: number;
    category_name: string;
    name?: string;
}

export interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface User {
    user_id: number;
    email: string;
    full_name: string;
    role: 'admin' | 'customer';
}