package main

import (
	"encoding/json"
	"fmt"
	"os"
	"sync"
	"time"

	"github.com/andygrunwald/go-jira"
)

type User struct {
	Email   string
	Key     string
	Url     string
	Tickets []Ticket

	Client *jira.Client
}

var configDir string = ""
var configFile string = ""

var lastTimeSet int = -1

func NewUser() *User {
	log.Debug("Creating new user")

	user := &User{}

	dir, err := os.UserConfigDir()
	if err != nil {
		log.Error(fmt.Sprintf("Error getting user config dir: %s", err))
	}

	configDir = fmt.Sprintf("%s\\jwrd", dir)
	configFile = fmt.Sprintf("%s\\config.json", configDir)

	log.Debug(fmt.Sprintf("Config file: %s", configFile))

	log.Debug("Checking for config file")

	if _, err := os.Stat(configDir); os.IsNotExist(err) {
		log.Debug("Creating config directory")

		err = os.Mkdir(configDir, 0755)
		if err != nil {
			log.Error(fmt.Sprintf("Error creating config dir: %s", err))
			return nil
		}

		log.Debug("Config directory created")
		log.Debug("Creating config file")

		err := user.Save("{}")
		if err != nil {
			log.Error(fmt.Sprintf("Error creating config file: %s", err))
			return nil
		}
	}

	if err = user.Load(); os.IsNotExist(err) {
		log.Error(fmt.Sprintf("Error loading config file: %s", err))
		log.Debug("Creating config file")

		err = user.Save("{}")
		if err != nil {
			log.Error(fmt.Sprintf("Error creating config file: %s", err))
			return nil
		}
	}

	log.Debug("Config file loaded")

	return user
}

func (u *User) Save(user string) error {
	log.Debug(fmt.Sprintf("Saving user: %s", user))

	file, err := os.OpenFile(configFile, os.O_RDWR|os.O_CREATE, 0755)
	if err != nil {
		log.Error(fmt.Sprintf("Error opening config file: %s", err))

		newFile, err := os.Create(configFile)
		if err != nil {
			log.Error(fmt.Sprintf("Error creating config file: %s", err))
			return err
		}

		j, err := json.Marshal(User{})
		if err != nil {
			log.Error(fmt.Sprintf("Error marshalling user: %s", err))
			return err
		}

		_, err = newFile.Write(j)
		if err != nil {
			log.Error(fmt.Sprintf("Error writing user to config file: %s", err))
			return err
		}

		newFile.Close()
		return nil
	}

	defer file.Close()

	err = json.Unmarshal([]byte(user), &u)
	if err != nil {
		log.Error(fmt.Sprintf("Error unmarshalling user: %s", err))
		return err
	}

	j, err := json.Marshal(&u)
	if err != nil {
		log.Error(fmt.Sprintf("Error marshalling user: %s", err))
		return err
	}

	_, err = file.Write(j)
	if err != nil {
		log.Error(fmt.Sprintf("Error writing user to config file: %s", err))
		return err
	}

	return nil
}

func (u *User) Load() error {
	raw, err := os.ReadFile(configFile)
	if err != nil {
		if os.IsNotExist(err) {
			log.Error("Config file does not exist")
		} else {
			log.Error(fmt.Sprintf("Error reading config file: %s", err))
		}
		return err
	}

	err = json.Unmarshal(raw, &u)
	if err != nil {
		log.Error(fmt.Sprintf("Error unmarshalling user: %s", err))
		return err
	}

	return nil
}

func (u *User) GetUserInfo() (string, error) {
	user, err := json.Marshal(u)
	if err != nil {
		log.Error(fmt.Sprintf("Error marshalling user: %s", err))
		return "", err
	}

	log.Debug(fmt.Sprintf("User: %s", user))

	return string(user), nil
}

func (u *User) CreateJiraClient() error {
	log.Debug("Creating client")

	tp := jira.BasicAuthTransport{
		Username: u.Email,
		Password: u.Key,
	}

	log.Debug(fmt.Sprintf("User: %s", u.toString()))

	client, err := jira.NewClient(tp.Client(), u.Url)
	if err != nil {
		log.Error(fmt.Sprintf("Error creating client: %s", err))
		return err
	}

	log.Debug("Client created")

	u.Client = client

	return nil
}

func (u *User) toString() string {
	user, err := json.Marshal(u)
	if err != nil {
		log.Error(fmt.Sprintf("Error marshalling user: %s", err))
		return ""
	}

	return string(user)
}

func (u *User) GetTickets(timeSet int) ([]Ticket, error) {
	log.Debug("Getting tickets")
	log.Debug(fmt.Sprintf("Time set: %d", timeSet))

	if timeSet != lastTimeSet {
		jql := ""
		now := time.Now()
		y, m, _ := now.Date()

		switch timeSet {
		case 0:
			// Today
			jql = "(assignee=currentuser() OR worklogAuthor=currentUser()) AND (worklogDate >= startOfDay() and worklogDate <= endOfDay())"
		case 1:
			// This week
			jql = "(assignee=currentuser() OR worklogAuthor=currentUser()) AND (worklogDate >= startOfWeek() and worklogDate <= endOfWeek())"
		case 2:
			// Last week
			jql = "(assignee=currentuser() OR worklogAuthor=currentUser()) AND (worklogDate >= startOfWeek('-1') and worklogDate <= endOfWeek('+1'))"
		case 3:
			// This month
			jql = "(assignee=currentuser() OR worklogAuthor=currentUser()) AND (worklogDate >= startOfMonth() and worklogDate <= endOfMonth())"
		case 4:
			// Last month
			jql = "(assignee=currentuser() OR worklogAuthor=currentUser()) AND (worklogDate >= startOfMonth('-1') and worklogDate <= endOfMonth('-1'))"
		case 5:
			// This Quarter
			quarter := (int(m)-1)/3 + 1
			startOfQuarter := time.Date(y, time.Month((quarter-1)*3+1), 1, 0, 0, 0, 0, time.Local)
			endOfQuarter := startOfQuarter.AddDate(0, 4, -1)
			jql = fmt.Sprintf("(assignee=currentuser() OR worklogAuthor=currentUser()) AND (worklogDate >= \"%s\" and worklogDate <= \"%s\")", startOfQuarter.Format("2006/01/02"), endOfQuarter.Format("2006/01/02"))
		case 6:
			// Last Quarter
			quarter := (int(m-3)-1)/3 + 1
			log.Debug(fmt.Sprintf("Quarter: %d", quarter))
			startOfQuarter := time.Date(y, time.Month((quarter-1)*3+1), 1, 0, 0, 0, 0, time.Local)
			log.Debug(fmt.Sprintf("Start of quarter: %s", startOfQuarter.Format("2006/01/02")))
			endOfQuarter := startOfQuarter.AddDate(0, quarter*3, -1)
			log.Debug(fmt.Sprintf("End of quarter: %s", endOfQuarter.Format("2006/01/02")))
			jql = fmt.Sprintf("(assignee=currentuser() OR worklogAuthor=currentUser()) AND (worklogDate >= \"%s\" and worklogDate <= \"%s\")", startOfQuarter.Format("2006/01/02"), endOfQuarter.Format("2006/01/02"))
		}

		log.Debug(fmt.Sprintf("JQL: %s", jql))

		tickets := []Ticket{}

		wg := sync.WaitGroup{}

		wg.Add(1)
		go func() {
			defer wg.Done()
			err := u.Client.Issue.SearchPages(jql, &jira.SearchOptions{},
				func(i jira.Issue) error {
					totalTime := 0

					wl, _, err := u.Client.Issue.GetWorklogs(i.ID)
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
								Id:   i.Fields.Parent.Key,
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

			// t.Store.Update(func(currentValue []Ticket) []Ticket {
			// 	// s, _ := json.Marshal(tickets)
			// 	t.Log.Debugf("Current Tickets: %s", currentValue)
			// 	t.Log.Debugf("New Tickets: %v", tickets)
			// 	return tickets
			// })

			if err != nil {
				fmt.Println(err)
			}
		}()

		wg.Wait()

		u.Tickets = tickets
		lastTimeSet = timeSet

		return tickets, nil
	}

	log.Debug("Getting tickets from cache")

	return u.Tickets, nil
}
