function formatSeconds(seconds) {
    if (seconds > 0) {
        // var days = Math.floor(seconds / 86400)
        // seconds -= days * 86400
        var hours = Math.floor(seconds / 3600)
        seconds -= hours * 3600
        var minutes = Math.floor(seconds / 60)
        seconds -= minutes * 60
        return (hours != 0 ? hours + " Hours " : "") + (minutes != 0 ? (minutes < 10 ? "0" + minutes + " Minutes " : minutes + " Minutes ") : "")
    }

    return 0
}

function fadeOut(ele) {
    ele.removeAttribute('hidden')
    ele.style.opacity = 1
    var interval = setInterval(function () {
        ele.style.opacity -= 0.1
        if (ele.style.opacity <= 0) {
            ele.style.opacity = 0
            clearInterval(interval)
        }
    }, 100)
}

var loginEle = document.querySelector('.login')
var loginFormEle = document.querySelector('.login-form')
var emailEle = document.querySelector('input[name="email"]')
var keyEle = document.querySelector('input[name="key"]')
var urlEle = document.querySelector('input[name="url"]')

var mainEle = document.querySelector('.main')
var selectTimeEle = document.querySelectorAll('.main > .set-time > .set')
var totalTimeEle = document.querySelector('.main > .header > .total-time > span')
var totalTicketsEle = document.querySelector('.main > .header > .total-tickets > span')
var ticketsEle = document.querySelector('.main > .tickets')

var noTicketsEle = document.createElement('div')
noTicketsEle.classList.add('no-tickets')
noTicketsEle.textContent = "You don't have any logged hours!"

var loaderEle = document.querySelector('.loading')

loginFormEle.addEventListener('submit', function (e) {
    e.preventDefault()

    if (urlEle.value == "" || emailEle == "" || keyEle == "") {
        errEle.innerHTML = "All fields must be filled and valid"
    } else {
        var j = '{"email": "' + emailEle.value + '", "url": "' + urlEle.value + '", "key": "' + keyEle.value + '"}'

        window.go.main.User.Save(j).then(function () {
            window.go.main.User.CreateJiraClient().catch((err) => {
                console.log(err)
                return
            })
            mainEle.removeAttribute('hidden')
            loginEle.setAttribute('hidden', true)
        }).catch(function (err) {
            console.log(err)
        })
    }
})

selectTimeEle.forEach(function(e) {
    e.addEventListener('click', function(e) {
        loaderEle.removeAttribute('hidden')
        ticketsEle.setAttribute('hidden', true)
            
        var totalWorkTime = 0
        totalTimeEle.textContent = formatSeconds(totalWorkTime)

        window.go.main.User.GetTickets(parseInt(e.target.dataset.value)).then(function(tickets, err){
            if (err) {
                console.log(err)
                return
            }

            totalTicketsEle.textContent = tickets.length

            ticketsEle.innerHTML = ""

            if (tickets.length > 0) {
                tickets.forEach(function(ticket, index) {
                    totalWorkTime += ticket.work_time
                    totalTimeEle.textContent = formatSeconds(totalWorkTime)

                    var ticketEle = document.createElement('div')
                    ticketEle.classList.add('ticket')
                    ticketEle.id = ticket.id

                    var copiedSpanEle = document.createElement('span')
                    copiedSpanEle.classList.add('copied')
                    copiedSpanEle.textContent = 'Copied link!'
                    copiedSpanEle.setAttribute('hidden', true)

                    var ticketIdEle = document.createElement('div')
                    ticketIdEle.classList.add('id')
                    
                    var ticketIdSpanEle = document.createElement('span')
                    ticketIdSpanEle.textContent = 'ID: ' + ticket.id

                    var ticketNameEle = document.createElement('div')
                    ticketNameEle.classList.add('name')
                    ticketNameEle.textContent = 'Ticket Title: ' + ticket.name

                    var ticketWorkTimeEle = document.createElement('div')
                    ticketWorkTimeEle.classList.add('time')
                    ticketWorkTimeEle.textContent = 'Work Time: ' + formatSeconds(ticket.work_time)

                    ticketIdEle.appendChild(ticketIdSpanEle)
                    ticketEle.appendChild(ticketIdEle)

                    if (ticket.parent.id != "") {
                        var ticketParentEle = document.createElement('div')

                        var ticketParentSpanEle = document.createElement('span')
                        ticketParentSpanEle.textContent = 'Parent: ' + ticket.parent.id

                        ticketParentEle.appendChild(ticketParentSpanEle)

                        ticketEle.appendChild(ticketParentEle)
                    }

                    ticketEle.appendChild(ticketNameEle)
                    ticketEle.appendChild(ticketWorkTimeEle)
                    ticketEle.appendChild(copiedSpanEle)
    
                    ticketEle.addEventListener('click', function() {
                        console.log(window.go.main.App)
                        window.go.main.App.CopyText(ticket.link).then(function(err){
                            if (err) {
                                console.log(err)
                                return
                            }
                            fadeOut(copiedSpanEle)
                        })
                    })
    
                    ticketEle.addEventListener('mousemove', function(e) {
                        copiedSpanEle.style.top = (window.scrollY + e.clientY + 5) + 'px'
                        copiedSpanEle.style.left = (e.clientX + 15) + 'px'
                    })
    
                    ticketsEle.appendChild(ticketEle)
    
                    if(tickets.length-1 > index) {
                        ticketsEle.insertAdjacentHTML('beforeend', `<hr/>`)
                    }
                })
            } else {
                totalTimeEle.textContent = 0
                ticketsEle.appendChild(noTicketsEle)
            }

            ticketsEle.removeAttribute('hidden')
            loaderEle.setAttribute('hidden', true)
        })
    })
})

window.go.main.User.GetUserInfo().then((u) => {
    user = JSON.parse(u)

    if (user && user.Email != undefined && user.Email != "") {
        window.go.main.User.CreateJiraClient().catch((err) => {
            console.log(err)
            return
        })

        mainEle.removeAttribute('hidden')
        loginEle.setAttribute('hidden', true)
    }
})
