// @ts-check
// Cynhyrchwyd y ffeil hon yn awtomatig. PEIDIWCH Â MODIWL
// This file is automatically generated. DO NOT EDIT
const go = {
  "main": {
    "App": {
      /**
       * CopyText
       * @param {string} arg1 - Go Type: string
       * @returns {Promise<Error>}  - Go Type: error
       */
      "CopyText": (arg1) => {
        return window.go.main.App.CopyText(arg1);
      },
      /**
       * Greet
       * @param {string} arg1 - Go Type: string
       * @returns {Promise<string>}  - Go Type: string
       */
      "Greet": (arg1) => {
        return window.go.main.App.Greet(arg1);
      },
    },
    "User": {
      /**
       * CreateJiraClient
       * @returns {Promise<Error>}  - Go Type: error
       */
      "CreateJiraClient": () => {
        return window.go.main.User.CreateJiraClient();
      },
      /**
       * GetTickets
       * @param {number} arg1 - Go Type: int
       * @returns {Promise<Array<Ticket>|Error>}  - Go Type: []main.Ticket
       */
      "GetTickets": (arg1) => {
        return window.go.main.User.GetTickets(arg1);
      },
      /**
       * GetUserInfo
       * @returns {Promise<string|Error>}  - Go Type: string
       */
      "GetUserInfo": () => {
        return window.go.main.User.GetUserInfo();
      },
      /**
       * Load
       * @returns {Promise<Error>}  - Go Type: error
       */
      "Load": () => {
        return window.go.main.User.Load();
      },
      /**
       * Save
       * @param {string} arg1 - Go Type: string
       * @returns {Promise<Error>}  - Go Type: error
       */
      "Save": (arg1) => {
        return window.go.main.User.Save(arg1);
      },
    },
  },

};
export default go;
