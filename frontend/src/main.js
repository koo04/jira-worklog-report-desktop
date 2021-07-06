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
		<div class="main" hidden=true> 
			<div class="time_select"> 
				<select name="time"> 
					<option value="0">Today</option>
					<option value="1">This Week</option>
					<option value="2">Last Week</option>
					<option value="3">This Month</option>
					<option value="4">Last Month</option>
					<option value="5">This Quarter</option>
					<option value="6">Last Quarter</option>
				</select>
			</div>
			<div><button class="refresh">Refresh</button></div>
			<div class="total_time">Total Time: <span>0</span></div>
			<div class="tickets">
				<div class="title">List of tickets</div>
				<div class="list"></div>
			</div>
		</div>`
	

	var loginEle = document.querySelector('.login')
	var loginFormEle = document.querySelector('.login-form')
	var emailEle = document.querySelector('input[name="email"]')
	var keyEle = document.querySelector('input[name="key"]')
	var urlEle = document.querySelector('input[name="url"]')
	
	var mainEle = document.querySelector('.main')
	var timeSelection = document.querySelector('.time_select>select')
	var totalTimeEle = document.querySelector('.total_time>span')
	var ticketsEle = document.querySelector('.tickets>.list')
	var refreshBtn = document.querySelector('.refresh')

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

		if (state.length > 0) {

			state.forEach(function(ticket) {
				totalWorkTime += ticket.work_time
				totalTimeEle.textContent = formatSeconds(totalWorkTime)

				console.log(ticket.parent)

				ticketsEle.innerHTML += ' \
					<hr> \
					<div id="' + ticket.id + '"> \
						<div class="id"><a href="' + ticket.link + '" target="_blank">ID: ' + ticket.id + '</a></div> \
						' + (ticket.parent.id != "" ? '<div class="parent"><a href="' + ticket.parent.link + ' target="_blank"> Parent: ' + ticket.parent.id + '</a></div>' : '') + ' \
						<div class="name">Ticket Title: ' + ticket.name + '</div> \
						<div class="time">Ticket Work Time: ' + formatSeconds(ticket.work_time) + '</div> \
					</div>'
			})
		} else {
			ticketsEle.innerHTML += "<hr><div>You don't have any logged hours!</div>"
		}

		refreshBtn.textContent = "Refresh"
		refreshBtn.removeAttribute('disabled')
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

	refreshBtn.addEventListener('click', function() {
		totalTimeEle.innerHTML = ''
		ticketsEle.innerHTML = ''

		refreshBtn.textContent = "Refreshing..."
		refreshBtn.setAttribute('disabled', true)

		backend.Tickets.GetTickets(parseInt(timeSelection.value)).then(function(err) {
			if (err != null) {
				console.log(err)
			}
		})
	})
}

runtime.Init(start)