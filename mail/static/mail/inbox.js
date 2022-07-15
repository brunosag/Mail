document.addEventListener('DOMContentLoaded', function() {

    // Use buttons to toggle between views
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click', compose_email);

    // By default, load the inbox
    load_mailbox('inbox');

});


function compose_email() {

    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';

    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';

    // Send mail
    document.querySelector("#compose-form").addEventListener("submit", () => {

        fetch("/emails", {
            method: "POST",
            body: JSON.stringify({
                recipients: document.querySelector("#compose-recipients").value,
                subject: document.querySelector("#compose-subject").value,
                body: document.querySelector("#compose-body").value
            })
        })
        load_mailbox("sent");

    });

}


function load_mailbox(mailbox) {
  
    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#email-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';

    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

    // Load mailbox
    fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
        emails.forEach(email => {
            const element = document.createElement("div");
            element.setAttribute("role", "button");
            element.classList.add("d-flex", "border", "p-2", "cursor-pointer");
            if (email.read == true) {
                element.style.backgroundColor = "hsl(0, 0%, 92%)";
            }
            element.innerHTML = `
                <strong>${email.sender}</strong>
                <span class="ms-2">${email.subject}</span>
                <span class="text-muted ms-auto">${email.timestamp}</span>`;
            element.addEventListener("click", () => load_email(email))
            document.querySelector('#emails-view').append(element);
        });
    });

}


function load_email(email) {

    // Show email view and hide other views
    document.querySelector('#email-view').style.display = 'block';
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';

    // Load email
    fetch(`/emails/${email.id}`)
    .then(response => response.json())
    .then(email => {
        document.querySelector('#email-view').innerHTML = `
            <div class="mb-1"><strong>From: </strong>${email.sender}</div>
            <div class="mb-1"><strong>To: </strong>${email.recipients}</div>
            <div class="mb-1"><strong>Subject: </strong>${email.subject}</div>
            <div class="mb-1"><strong>Timestamp: </strong>${email.timestamp}</div>
            <hr>
            <div>${email.body}</div>
        `
    })

    // Mark email as read
    fetch(`/emails/${email.id}`, {
        method: "PUT",
        body: JSON.stringify({
            read: true
        })
    })

}
