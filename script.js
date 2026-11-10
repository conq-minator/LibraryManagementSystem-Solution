"use strict";
let cart = [];
const $ = id => document.getElementById(id);

function showAlert(msg, isErr = false) {
  const el = $("alert");
  if (!el) return;
  el.textContent = msg; el.className = `alert ${isErr ? 'alert-error' : ''}`; el.style.display = msg ? "block" : "none";
  if (msg) setTimeout(() => { if (el.textContent === msg) el.style.display = "none"; }, 3500);
}

function showSection(id) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
  $(id)?.classList.add("active"); $(`nav-${id}`)?.classList.add("active"); showAlert("");
  const views = { dashboard: renderDashboard, books: renderBooks, search: renderSearch, issued: renderIssued, history: renderHistory };
  if (views[id]) views[id]();
  if (window.lucide) lucide.createIcons();
}

function toggleCart(id) {
  const book = backend.getBooks()[id];
  if (!book) return;
  const idx = cart.indexOf(id);
  if (idx > -1) { cart.splice(idx, 1); showAlert(`Removed "${book.title}" from cart.`); }
  else {
    if (book.availableCopies <= 0) return showAlert(`"${book.title}" has no available copies.`, true);
    cart.push(id); showAlert(`Added "${book.title}" to cart.`);
  }
  updateCartUI(); renderBooks();
}

function updateCartUI() {
  const bar = $("cartBar");
  if ($("cartCountBadge")) $("cartCountBadge").textContent = cart.length;
  if (bar) { bar.style.display = cart.length ? "flex" : "none"; $("cartInfoText").textContent = `${cart.length} book(s) in cart: ${cart.join(", ")}`; }
}

function checkoutCart() {
  const sid = ($("cartStudentId")?.value || "").trim().toUpperCase();
  if (!sid) return showAlert("Enter Student ID to checkout.", true);
  try {
    backend.checkoutCart(cart, sid);
    showAlert(`Checked out ${cart.length} book(s) for Student ${sid}!`);
    cart = []; $("cartStudentId").value = "";
    updateCartUI(); renderBooks(); renderDashboard();
  } catch (e) { showAlert(e.message, true); }
}

function renderDashboard() {
  const bks = Object.values(backend.getBooks()), issues = backend.getIssues();
  $("statTitles").textContent = bks.length; $("statCopies").textContent = bks.reduce((a, b) => a + (Number(b.availableCopies) || 0), 0);
  $("statActive").textContent = issues.filter(r => !r.returned).length; $("statReturned").textContent = issues.filter(r => r.returned).length;
}

function renderBooks() {
  const tbody = $("booksTableBody");
  if (!tbody) return;
  tbody.innerHTML = Object.values(backend.getBooks()).map(b => {
    const inC = cart.includes(b.id), avail = b.availableCopies > 0;
    return `<tr class="clickable-row ${inC ? 'in-cart' : ''}" onclick="toggleCart('${b.id}')">
      <td><strong>${b.id}</strong></td><td>${b.title}</td><td>${b.author}</td><td>${b.year}</td>
      <td><span class="badge ${avail ? '' : 'badge-danger'}">${b.availableCopies} Left</span></td>
      <td><button class="btn btn-sm ${inC ? 'btn-gold' : 'btn-outline'}" onclick="event.stopPropagation();toggleCart('${b.id}')">${inC ? 'In Cart &#10003;' : '+ Add to Cart'}</button></td>
    </tr>`;
  }).join("");
}

function renderSearch() {
  const q = ($("searchQuery")?.value || "").trim().toLowerCase();
  $("searchResultsBody").innerHTML = Object.values(backend.getBooks())
    .filter(b => !q || b.id.toLowerCase().includes(q) || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q))
    .map(b => `<tr><td><strong>${b.id}</strong></td><td>${b.title}</td><td>${b.author}</td><td>${b.year}</td><td><span class="badge ${b.availableCopies > 0 ? '' : 'badge-danger'}">${b.availableCopies} Left</span></td></tr>`).join("");
}

function renderIssued() {
  const list = backend.getIssues().filter(r => !r.returned), bks = backend.getBooks();
  $("issuedTableBody").innerHTML = list.length === 0 ? '<tr><td colspan="6" style="text-align:center;">No books issued.</td></tr>'
    : list.map((r, i) => `<tr><td>#${i + 1}</td><td><strong>${r.bookId}</strong></td><td>${bks[r.bookId]?.title || 'Unknown'}</td><td>${r.studentId}</td><td>${r.issueDate} &rarr; ${r.dueDate}</td><td><button class="btn btn-sm btn-outline" onclick="returnDirect('${r.bookId}','${r.studentId}')">Return</button></td></tr>`).join("");
}

function renderHistory() {
  const list = backend.getIssues().filter(r => r.returned), bks = backend.getBooks();
  $("historyTableBody").innerHTML = list.length === 0 ? '<tr><td colspan="5" style="text-align:center;">No previous records.</td></tr>'
    : list.map((r, i) => `<tr><td>#${i + 1}</td><td><strong>${r.bookId}</strong></td><td>${bks[r.bookId]?.title || 'Unknown'}</td><td>${r.studentId}</td><td>${r.issueDate} &bull; Ret: ${r.returnDate}</td></tr>`).join("");
}

function returnDirect(bId, sId) {
  try { backend.returnBook(bId, sId); showAlert(`Book "${bId}" returned.`); renderIssued(); renderDashboard(); } catch (e) { showAlert(e.message, true); }
}

const bindForm = (id, fn) => $(id)?.addEventListener("submit", e => { e.preventDefault(); try { fn(); e.target.reset(); renderDashboard(); } catch (err) { showAlert(err.message, true); } });

document.addEventListener("DOMContentLoaded", () => {
  bindForm("addBookForm", () => { backend.addBook({ id: $("bookId").value.trim().toUpperCase(), title: $("bookTitle").value.trim(), author: $("bookAuthor").value.trim(), year: Number($("bookYear").value), availableCopies: Number($("bookCopies").value) }); showAlert("Book added."); });
  bindForm("issueForm", () => { backend.issueBook($("issueBookId").value.trim().toUpperCase(), $("issueStudentId").value.trim().toUpperCase(), $("issueDueDate").value); showAlert("Book issued."); });
  bindForm("returnForm", () => { backend.returnBook($("returnBookId").value.trim().toUpperCase(), $("returnStudentId").value.trim().toUpperCase()); showAlert("Book returned."); });
  renderDashboard(); updateCartUI(); if (window.lucide) lucide.createIcons();
});
