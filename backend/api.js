"use strict";

const DEFAULT_BOOKS = {
  "IEM-CS-101": { id: "IEM-CS-101", title: "Computer Networks", author: "Peterson & Davie", year: 2024, availableCopies: 4 },
  "IEM-CS-102": { id: "IEM-CS-102", title: "Operating System Concepts", author: "Silberschatz & Galvin", year: 2023, availableCopies: 2 },
  "IEM-AI-201": { id: "IEM-AI-201", title: "Artificial Intelligence: Modern Approach", author: "Russell & Norvig", year: 2022, availableCopies: 3 },
  "IEM-EC-301": { id: "IEM-EC-301", title: "Digital Signal Processing", author: "Proakis & Manolakis", year: 2021, availableCopies: 1 }
};

const DEFAULT_ISSUES = [
  { bookId: "IEM-CS-102", studentId: "IEM-2024-042", issueDate: "2026-10-28", dueDate: "2026-11-11", returnDate: "", returned: false },
  { bookId: "IEM-EC-301", studentId: "IEM-2024-019", issueDate: "2026-10-15", dueDate: "2026-10-29", returnDate: "2026-10-28", returned: true }
];

window.backend = {
  getBooks() {
    return JSON.parse(localStorage.getItem("iemBooks") || JSON.stringify(DEFAULT_BOOKS));
  },
  saveBooks(data) {
    localStorage.setItem("iemBooks", JSON.stringify(data));
  },
  getIssues() {
    return JSON.parse(localStorage.getItem("iemIssues") || JSON.stringify(DEFAULT_ISSUES));
  },
  saveIssues(data) {
    localStorage.setItem("iemIssues", JSON.stringify(data));
  },
  addBook(book) {
    const books = this.getBooks();
    if (books[book.id]) throw new Error(`Book ID "${book.id}" already exists.`);
    books[book.id] = book;
    this.saveBooks(books);
    return book;
  },
  issueBook(bookId, studentId, dueDate) {
    const books = this.getBooks();
    const issues = this.getIssues();
    const book = books[bookId];
    if (!book) throw new Error(`Book "${bookId}" not found.`);
    if (book.availableCopies <= 0) throw new Error(`No available copies for "${book.title}".`);
    if (issues.some(r => r.bookId === bookId && r.studentId === studentId && !r.returned)) {
      throw new Error(`Student ${studentId} already has an active issue of this book.`);
    }
    const today = new Date().toISOString().split("T")[0];
    issues.push({ bookId, studentId, issueDate: today, dueDate: dueDate || today, returnDate: "", returned: false });
    book.availableCopies--;
    this.saveBooks(books);
    this.saveIssues(issues);
  },
  returnBook(bookId, studentId) {
    const books = this.getBooks();
    const issues = this.getIssues();
    const rec = issues.find(r => r.bookId === bookId && r.studentId === studentId && !r.returned);
    if (!rec) throw new Error(`No active issue found for Book ${bookId} & Student ${studentId}.`);
    rec.returned = true;
    rec.returnDate = new Date().toISOString().split("T")[0];
    if (books[bookId]) books[bookId].availableCopies++;
    this.saveBooks(books);
    this.saveIssues(issues);
  },
  checkoutCart(cartBookIds, studentId, dueDate) {
    if (!cartBookIds || cartBookIds.length === 0) throw new Error("Cart is empty.");
    if (!studentId) throw new Error("Student ID is required for checkout.");
    cartBookIds.forEach(id => this.issueBook(id, studentId, dueDate));
  }
};
