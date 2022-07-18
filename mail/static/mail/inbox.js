document.addEventListener('DOMContentLoaded', function() {

    // Use buttons to toggle between views
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click', compose_email);

    // By default, load the inbox
    load_mailbox('inbox');

});


function alert(message) {

    document.querySelector("#alert").innerHTML = `
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
            <div>${message}</div>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;

}


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
    document.querySelector("#compose-form").addEventListener("submit", (event) => {

        event.preventDefault();
        fetch("/emails", {
            method: "POST",
            body: JSON.stringify({
                recipients: document.querySelector("#compose-recipients").value,
                subject: document.querySelector("#compose-subject").value,
                body: document.querySelector("#compose-body").value
            })
        })
        .then(response => response.json())
        .then(result => {

            // Handle errors
            if ("error" in result) {
                alert(result.error);
            }
            else {
                load_mailbox("sent");
                return true;
            }
        });
    });

}


function load_mailbox(mailbox) {
  
    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#email-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';

    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3 class="mb-3">${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

    // Load mailbox
    fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {

        // Handle errors
        if ("error" in emails) {
            alert(emails.error);
        }
        else {
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
        }
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

        // Handle errors
        if ("error" in email) {
            alert(email.error);
        }
        else {
            let body = email.body.replace(/(?:\r\n|\r|\n)/g, '<br>');
            document.querySelector('#email-view').innerHTML = `
                <div class="mb-1"><strong>From: </strong>${email.sender}</div>
                <div class="mb-1"><strong>To: </strong>${email.recipients}</div>
                <div class="mb-1"><strong>Subject: </strong>${email.subject}</div>
                <div class="mb-1"><strong>Timestamp: </strong>${email.timestamp}</div>
                <hr id="division">
                <div>${body}</div>
            `;
    
            // Reply button
            const reply = document.createElement("button");
            reply.classList.add("btn", "btn-outline-secondary", "btn-sm");
            reply.innerHTML = "Reply";
            reply.setAttribute("id", "reply");
            reply.addEventListener("click", () => {
                reply_email(email);
            });
            document.querySelector("#email-view").insertBefore(reply, document.querySelector("#division"));
    
            // If user recieved the email
            fetch("/emails/inbox")
            .then(response => response.json())
            .then(emails => {
                fetch("/emails/archive")
                .then(response => response.json())
                .then(archive => {
                    archive.forEach(archived => {
                        emails.push(archived);
                    });
                    const emails_id = [];
                    emails.forEach(email => {emails_id.push(email.id)});
                    if (emails_id.includes(email.id)) {
    
                        // Archive button
                        const archive = document.createElement("button");
                        archive.classList.add("btn", "btn-sm", "me-2");
                        if (email.archived == true) {
                            archive.classList.add("btn-secondary");
                            archive.innerHTML = "Unarchive";
                            archive.addEventListener("click", () => {
                                fetch(`emails/${email.id}`, {
                                    method: "PUT",
                                    body: JSON.stringify({
                                        archived: false
                                    })
                                })
                                load_mailbox("inbox");
                            });
                        }
                        else {
                            archive.classList.add("btn-outline-secondary")
                            archive.innerHTML = "Archive";
                            archive.addEventListener("click", () => {
                                fetch(`emails/${email.id}`, {
                                    method: "PUT",
                                    body: JSON.stringify({
                                        archived: true
                                    })
                                })
                                load_mailbox("inbox");
                            });
                        }
                        document.querySelector("#email-view").insertBefore(archive, document.querySelector("#reply"))
    
                    }
                });
            });

            // Mark email as read
            fetch(`/emails/${email.id}`, {
                method: "PUT",
                body: JSON.stringify({
                    read: true
                })
            })
        }
    })

}


function reply_email(email) {

    compose_email(email);

    // Pre-fill composition fields
    document.querySelector('#compose-recipients').value = email.sender;
    if (!email.subject.startsWith("Re: ")) {
        document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
    }
    else {
        document.querySelector('#compose-subject').value = email.subject;
    }
    document.querySelector('#compose-body').value = `\n\nOn ${email.timestamp} ${email.sender} wrote:\n${email.body}`;

}
