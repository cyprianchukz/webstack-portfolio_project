document.addEventListener('DOMContentLoaded', () => {
    const transactionForm = document.getElementById('transactionForm');
    const transactionList = document.getElementById('transactionList');
    const balanceDisplay = document.getElementById('balance');
    const incomeDisplay = document.getElementById('income');
    const expenseDisplay = document.getElementById('expense');

    // Fetch and display balance
    async function fetchBalance() {
        try {
            const response = await fetch('http://localhost:3000/api/balance', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch balance');
            }

            const result = await response.json();

            // Fallback to 0 if totalIncome or totalExpense is null
            const totalIncome = result.totalIncome ? parseFloat(result.totalIncome) : 0;
            const totalExpense = result.totalExpense ? parseFloat(result.totalExpense) : 0;
            const balance = result.balance ? parseFloat(result.balance) : 0;

            balanceDisplay.textContent = `$${balance.toFixed(2)}`;
            incomeDisplay.textContent = `$${totalIncome.toFixed(2)}`;
            expenseDisplay.textContent = `$${totalExpense.toFixed(2)}`;

        } catch (error) {
            console.error('Error fetching balance:', error);
        }
    }

    // Fetch and display transactions
    async function fetchTransactions() {
        try {
            const response = await fetch('http://localhost:3000/api/transactions', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const transactions = await response.json();
            transactionList.innerHTML = '';

            transactions.forEach(transaction => {
                const li = document.createElement('li');
                li.textContent = `${transaction.particulars} - $${transaction.amount.toFixed(2)} (${transaction.type}) on ${new Date(transaction.date).toLocaleDateString()}`;
                transactionList.appendChild(li);
            });
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    }

    // Add a new transaction
    if (transactionForm) {
        transactionForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const formData = new FormData(transactionForm);
            const type = formData.get('type') ? 'income' : 'expense'; // Checkbox checked means 'income'
            const particulars = formData.get('particulars');
            const amount = formData.get('amount');
            const date = formData.get('date');

            try {
                const response = await fetch('http://localhost:3000/api/transactions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        type,
                        particulars,
                        amount,
                        date,
                    }),
                });

                const result = await response.json();
                if (response.ok) {
                    alert(result.message || 'Transaction added successfully!');
                    transactionForm.reset();
                    fetchTransactions();
                    fetchBalance();
                } else {
                    alert(result.message || 'Transaction failed');
                }
            } catch (error) {
                console.error('Error adding transaction:', error);
            }
        });
    }

    // Initial fetch of balance and transactions
    fetchBalance();
    fetchTransactions();
});
