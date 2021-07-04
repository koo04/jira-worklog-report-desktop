package main

import (
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/andygrunwald/go-jira"
	"github.com/wailsapp/wails"
)

type Tickets struct {
	Log     *wails.CustomLogger
	Runtime *wails.Runtime
	Store   *wails.Store
}

type Ticket struct {
	Id       string `json:"id"`
	Name     string `json:"name"`
	Link     string `json:"link"`
	WorkTime int    `json:"work_time"`
	Parent   Parent `json:"parent,omitempty"`
}

type Parent struct {
	Id   string `json:"id"`
	Link string `json:"link"`
}

var user *User
var client *jira.Client

func (t *Tickets) WailsInit(runtime *wails.Runtime) error {
	t.Runtime = runtime
	t.Log = runtime.Log.New("Tickets")
	t.Store = runtime.Store.New("Tickets", []Ticket{})

	return nil
}

func (t *Tickets) CreateClient(jUser string) error {
	t.Log.Debugf("Loading User %s", jUser)

	err := json.Unmarshal([]byte(jUser), &user)
	if err != nil {
		return err
	}

	tp := jira.BasicAuthTransport{
		Username: user.Email,
		Password: user.Key,
	}

	t.Log.Debugf("Creating client with user: %v", user)

	c, err := jira.NewClient(tp.Client(), user.Url)
	if err != nil {
		return err
	}

	client = c

	return nil
}

func (t *Tickets) GetTickets(timeSet int) error {
	t.Log.Debugf("%v")

	jql := ""
	// now := time.Date(2021, 1, 1, 0, 0, 0, 0, time.Local)
	now := time.Now()
	y, m, _ := now.Date()

	switch timeSet {
	case 0:
		// Today
		jql = "assignee=currentuser() AND (worklogDate >= startOfDay() and worklogDate <= endOfDay())"
	case 1:
		// This week
		jql = "assignee=currentuser() AND (worklogDate >= startOfWeek() and worklogDate <= endOfWeek())"
	case 2:
		// Last week
		jql = "assignee=currentuser() AND (worklogDate >= startOfWeek('-1') and worklogDate <= endOfWeek('+1'))"
	case 3:
		// This month
		jql = "assignee=currentuser() AND (worklogDate >= startOfMonth() and worklogDate <= endOfMonth())"
	case 4:
		// Last month
		jql = "assignee=currentuser() AND (worklogDate >= startOfMonth('-1') and worklogDate <= endOfMonth('-1'))"
	case 5:
		// This Quarter
		quarter := (int(m)-1)/3 + 1
		startOfQuarter := time.Date(y, time.Month((quarter-1)*3+1), 1, 0, 0, 0, 0, time.Local)
		endOfQuarter := startOfQuarter.AddDate(0, 4, -1)
		jql = fmt.Sprintf("assignee=currentuser() AND (worklogDate >= \"%s\" and worklogDate <= \"%s\")", startOfQuarter.Format("2006/01/02"), endOfQuarter.Format("2006/01/02"))
	case 6:
		// Last Quarter
		quarter := (int(m-3)-1)/3 + 1
		startOfQuarter := time.Date(y, time.Month((quarter-1)*3+1), 1, 0, 0, 0, 0, time.Local)
		endOfQuarter := startOfQuarter.AddDate(0, 4, -1)
		jql = fmt.Sprintf("assignee=currentuser() AND (worklogDate >= \"%s\" and worklogDate <= \"%s\")", startOfQuarter.Format("2006/01/02"), endOfQuarter.Format("2006/01/02"))
	}

	tickets := []Ticket{}

	wg := sync.WaitGroup{}

	wg.Add(1)
	go func() {
		defer wg.Done()
		err := client.Issue.SearchPages(jql, &jira.SearchOptions{},
			func(i jira.Issue) error {
				totalTime := 0

				wl, _, err := client.Issue.GetWorklogs(i.ID)
				if err != nil {
					fmt.Println(err)
					return err
				}

				for _, worklog := range wl.Worklogs {
					totalTime += worklog.TimeSpentSeconds
				}

				if i.Fields.Parent != nil {
					tickets = append(tickets, Ticket{
						Id:       i.Key,
						Name:     i.Fields.Summary,
						Link:     fmt.Sprintf("https://cakemarketing.atlassian.net/browse/%s", i.Key),
						WorkTime: totalTime,
						Parent: Parent{
							Id:   i.Fields.Parent.ID,
							Link: fmt.Sprintf("https://cakemarketing.atlassian.net/browse/%s", i.Fields.Parent.Key),
						},
					})
				} else {
					tickets = append(tickets, Ticket{
						Id:       i.Key,
						Name:     i.Fields.Summary,
						Link:     fmt.Sprintf("https://cakemarketing.atlassian.net/browse/%s", i.Key),
						WorkTime: totalTime,
					})
				}

				return nil
			})

		t.Store.Update(func(currentValue []Ticket) []Ticket {
			// s, _ := json.Marshal(tickets)
			t.Log.Debugf("Current Tickets: %s", currentValue)
			t.Log.Debugf("New Tickets: %v", tickets)
			return tickets
		})

		if err != nil {
			fmt.Println(err)
		}
	}()

	wg.Wait()

	return nil
}
