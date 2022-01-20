interface go {
  "main": {
    "App": {
		CopyText(arg1:string):Promise<Error>
		Greet(arg1:string):Promise<string>
    },
    "User": {
		CreateJiraClient():Promise<Error>
		GetTickets(arg1:number):Promise<Array<Ticket>|Error>
		GetUserInfo():Promise<string|Error>
		Load():Promise<Error>
		Save(arg1:string):Promise<Error>
    },
  }

}

declare global {
	interface Window {
		go: go;
	}
}
