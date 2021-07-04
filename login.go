package main

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/wailsapp/wails"
)

type Login struct {
	Log     *wails.CustomLogger
	Runtime *wails.Runtime
	User    *User
}

type User struct {
	Email string `json:"email"`
	Key   string `json:"key"`
	Url   string `json:"url"`
}

var configDir string = ""
var configFile string = ""

func (l *Login) WailsInit(runtime *wails.Runtime) error {
	l.Runtime = runtime
	l.Log = runtime.Log.New("Login")

	dir, err := os.UserConfigDir()
	if err != nil {
		l.Log.Errorf("Error getting config directroy: %v", err)
		return err
	}

	configDir = fmt.Sprintf("%s/jwrd", dir)
	configFile = fmt.Sprintf("%s/config.json", configDir)

	if _, err := os.Stat(configDir); os.IsNotExist(err) {
		err := os.Mkdir(configDir, os.ModeDir)
		if err != nil {
			return err
		}

		err = l.Save("")
		if err != nil {
			return err
		}
	}

	if err = l.Load(); os.IsNotExist(err) {
		err := l.Save("")
		if err != nil {
			l.Log.Errorf("Error initializing Login: %v", err)
			return err
		}
	}

	return nil
}

func (l *Login) Save(user string) error {
	file, err := os.OpenFile(configFile, os.O_RDWR, 0600)
	if err != nil {
		l.Log.Errorf("Error getting config file: %v", err)
		newFile, err := os.Create(configFile)
		if err != nil {
			l.Log.Errorf("Error creating config file: %v", err)
			return err
		}

		j, err := json.Marshal(User{
			Email: "",
			Key:   "",
			Url:   "",
		})

		if err != nil {
			l.Log.Errorf("Error marshaling new User: %v", err)
			return err
		}

		_, errr := newFile.Write(j)
		if errr != nil {
			l.Log.Errorf("Error saving User to file: %v", errr)
			return errr
		}

		file.Close()
		return nil
	}

	defer file.Close()

	err = json.Unmarshal([]byte(user), &l.User)
	if err != nil {
		l.Log.Errorf("Error unmarshaling json user: %v", err)
		return err
	}

	j, err := json.Marshal(&l.User)
	if err != nil {
		l.Log.Errorf("Error marshaling User: %v", err)
		return err
	}

	_, errr := file.Write(j)
	if errr != nil {
		l.Log.Errorf("Error marshaling User: %v", errr)
		return errr
	}

	return nil
}

func (l *Login) Load() error {
	raw, err := os.ReadFile(configFile)
	if err != nil {
		if os.IsNotExist(err) {
			l.Log.Error("Config file doesn't exist")
		} else {
			l.Log.Errorf("Error reading config file for loading: %v", err)
		}
		return err
	}

	err = json.Unmarshal(raw, &l.User)
	if err != nil {
		l.Log.Errorf("Error unmarshaling config file for loading: %v", err)
		return err
	}

	return nil
}

func (l *Login) GetUserInfo() (string, error) {
	user, err := json.Marshal(l.User)
	if err != nil {
		l.Log.Errorf("Error marshaling User for return: %v", err)
		return "", err
	}

	l.Log.Debug(string(user))

	return string(user), nil
}
