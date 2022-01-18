import 'core-js/stable'
const runtime = require('@wailsapp/runtime')

function formatSeconds(seconds) {
	var days = Math.floor(seconds / 86400)
	seconds -= days * 86400
	var hours = Math.floor(seconds / 3600)
	seconds -= hours * 3600
	var minutes = Math.floor(seconds / 60)
	seconds -= minutes * 60
	return (days != 0 ? days + " Days " : "") + (hours != 0 ? hours + " Hours " : "") + (minutes != 0 ? (minutes < 10 ? "0" + minutes + " Minutes " : minutes + " Minutes ") : "")
}

function fadeOut(ele) {
	ele.removeAttribute('hidden')
	ele.style.opacity = 1
	var interval = setInterval(function() {
		ele.style.opacity -= 0.1
		if (ele.style.opacity <= 0) {
			ele.style.opacity = 0
			clearInterval(interval)
		}
	}, 100)
}

function start() {
	var ticketsStore = runtime.Store.New('Tickets')
	var app = document.getElementById('app')
	
	var user = {}
	
	app.style.width = '100%'
	app.style.height = '100%'

	app.innerHTML = `
		<div class="login">
			<div class="form">
				<form class="login-form">
					<input type="text" name="url" placeholder="Jira URL"/>
					<input type="email" name="email" placeholder="Jira Email"/>
					<input type="password" name="key" placeholder="API Key"/>
					<button>login</button>
				</form> 
			</div> 
		</div>
		<div class="loading lds-ring" hidden="true"><div></div><div></div><div></div><div></div></div>
		<div class="main" hidden=true> 
			<div class="set-time">
				<div class="set" data-value=0>Today</div>
				<div class="set" data-value=1>This Week</div>
				<div class="set" data-value=2>Last Week</div>
				<div class="set" data-value=3>This Month</div>
				<div class="set" data-value=4>Last Month</div>
				<div class="set" data-value=5>This Quarter</div>
				<div class="set" data-value=6>Last Quarter</div>
			</div>
			<div class="header">
				<div class="total-time">
					Total Time: <span>0</span>
				</div>
				<hr>
			</div>
			<div class="tickets">
			</div>
		</div>`
	
	var loginEle = document.querySelector('.login')
	var loginFormEle = document.querySelector('.login-form')
	var emailEle = document.querySelector('input[name="email"]')
	var keyEle = document.querySelector('input[name="key"]')
	var urlEle = document.querySelector('input[name="url"]')
	
	var mainEle = document.querySelector('.main')
	var selectTimeEle = document.querySelectorAll('.main > .set-time > .set')
	var totalTimeEle = document.querySelector('.main > .header > .total-time > span')
	var ticketsEle = document.querySelector('.main > .tickets')

	var loaderEle = document.querySelector('.loading')

	backend.Login.GetUserInfo().then(function(u) {
		user = JSON.parse(u)

		if (user && user.email != "") {
			backend.Tickets.CreateClient(u).catch(function(err) {
				console.log(err)
			})
			mainEle.removeAttribute('hidden')
			loginEle.setAttribute('hidden', true)
		}
	})

	ticketsStore.subscribe(function(state) {
		var totalWorkTime = 0

		ticketsEle.innerHTML = ""

		if (state.length > 0) {
			state.forEach(function(ticket, index) {
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
					backend.copyURL(ticket.link).then(function(err){
						if (err) {
							console.log(err)
							return
						}
						fadeOut(copiedSpanEle)
					})
				})

				ticketEle.addEventListener('mousemove', function(e) {
					copiedSpanEle.style.top = (e.clientY + 5) + 'px'
					copiedSpanEle.style.left = (e.clientX + 15) + 'px'
				})

				ticketsEle.appendChild(ticketEle)

				if(state.length-1 > index) {
					ticketsEle.insertAdjacentHTML('beforeend', `<hr/>`)
				}
			})
		} else {
			ticketsEle.innerHTML += "<hr><div>You don't have any logged hours!</div>"
		}
	})

	loginFormEle.addEventListener('submit', function(e) {
		e.preventDefault()
		if (urlEle.value == "" || emailEle == "" || keyEle == "") {
			errEle.innerHTML = "All fields must be filled and valid"
		} else {
			var j = '{"email": "' + emailEle.value + '", "url": "' + urlEle.value + '", "key": "' + keyEle.value + '"}'
			backend.Login.Save(j).then(function() {
				mainEle.removeAttribute('hidden')
				loginEle.setAttribute('hidden', true)
			}).catch(function(err) {
				console.log(err)
			})
			backend.Tickets.CreateClient(j).catch(function(err) {
				console.log(err)
			})
		}
	})

	selectTimeEle.forEach(function(e) {
		e.addEventListener('click', function(e) {
			loaderEle.removeAttribute('hidden')
			ticketsEle.setAttribute('hidden', true)

			backend.Tickets.GetTickets(parseInt(e.target.dataset.value)).then(function(err){
				if (err) {
					console.log(err)
				}

				ticketsEle.removeAttribute('hidden')
				loaderEle.setAttribute('hidden', true)
			})
		})
	})
}

runtime.Init(start)