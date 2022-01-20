package main

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
