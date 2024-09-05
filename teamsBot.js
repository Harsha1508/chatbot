const { TeamsActivityHandler, CardFactory } = require("botbuilder");
const { fetchBPShipmentService } = require("./axios/BPShipmentService"); // Import the function

class TeamsBot extends TeamsActivityHandler {
  constructor() {
    super();

    this.onMessage(async (context, next) => {
      console.log("Activity:", context.activity); // Log the incoming activity

      if (context.activity.value && context.activity.value.action) {
        console.log("Action:", context.activity.value.action); // Log the action received

        const action = context.activity.value.action;
        if (action === "searchBP") {
          await this.showSearchBPCard(context);
        } else if (action === "search") {
          const { mblNumber, hblNumber, country } = context.activity.value;
          await this.handleSearch(context, mblNumber, hblNumber, country);
        } else if (action === "searchAgain") {
          const { mblNumber, hblNumber, country } = context.activity.value;
          await this.showSearchBPCard(context, mblNumber, hblNumber, country);
        } else if (action === "exit") {
          await context.sendActivity(
            "Thank you for using the bot. Enter 'Search BP' to start again."
          );
        }
      } else {
        await this.showWelcomeMessage(context);
      }
      await next();
    });

    this.onMembersAdded(async (context, next) => {
      const membersAdded = context.activity.membersAdded;
      for (let cnt = 0; cnt < membersAdded.length; cnt++) {
        if (membersAdded[cnt].id) {
          await this.showWelcomeMessage(context);
          break;
        }
      }
      await next();
    });
  }

  async showWelcomeMessage(context) {
    const welcomeCard = {
      $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
      type: "AdaptiveCard",
      version: "1.3",
      body: [
        {
          type: "TextBlock",
          text: "Welcome to the Custom Clearance Chatbot!",
          weight: "Bolder",
          size: "Medium",
        },
        {
          type: "TextBlock",
          text: "To get started, click on the button below.",
          wrap: true,
        },
      ],
      actions: [
        {
          type: "Action.Submit",
          title: "Search BP",
          data: { action: "searchBP" },
        },
      ],
    };

    await context.sendActivity({
      attachments: [CardFactory.adaptiveCard(welcomeCard)],
    });
  }

  async showSearchBPCard(
    context,
    mblNumber = "",
    hblNumber = "",
    country = ""
  ) {
    const searchBPCard = {
      $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
      type: "AdaptiveCard",
      version: "1.3",
      body: [
        {
          type: "TextBlock",
          text: "Search BP",
          weight: "Bolder",
          size: "Medium",
        },
        {
          type: "Input.Text",
          id: "mblNumber",
          placeholder: "Enter MBL Number",
          value: mblNumber,
        },
        {
          type: "Input.Text",
          id: "hblNumber",
          placeholder: "Enter HBL Number",
          value: hblNumber,
        },
        {
          type: "Input.ChoiceSet",
          id: "country",
          style: "compact",
          placeholder: "Select a Country",
          value: country,
          choices: [
            { title: "USA", value: "US" },
            { title: "Canada", value: "CA" },
          ],
        },
      ],
      actions: [
        {
          type: "Action.Submit",
          title: "Search",
          data: { action: "search" },
        },
      ],
    };

    await context.sendActivity({
      attachments: [CardFactory.adaptiveCard(searchBPCard)],
    });
  }

  async handleSearch(context, mblNumber, hblNumber, country) {
    try {
      // Send a temporary card with "Fetching..." message
      const fetchingCard = {
        $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
        type: "AdaptiveCard",
        version: "1.3",
        body: [
          {
            type: "TextBlock",
            text: "Search BP",
            weight: "Bolder",
            size: "Medium",
          },
          {
            type: "TextBlock",
            text: "Fetching shipment details, please wait...",
            weight: "Lighter",
            size: "Small",
          },
        ],
      };

      await context.sendActivity({
        attachments: [CardFactory.adaptiveCard(fetchingCard)],
      });

      // Proceed with the data fetching process
      const payload = {
        filterData: [
          { attribute: "mbl_no", values: [mblNumber.trim()] },
          { attribute: "HBL_No", values: [hblNumber.trim()] },
          { attribute: "CTRY_OF_IMPORT", values: [country.trim()] },
        ],
        pageNo: 0,
        pageSize: 10,
      };

      let BPShipmentData = await fetchBPShipmentService(payload);

      console.log("BPShipmentData in handleSearch:", BPShipmentData);

      if (
        BPShipmentData &&
        !BPShipmentData.apifailStatus &&
        BPShipmentData.value &&
        Array.isArray(BPShipmentData.value.data) &&
        BPShipmentData.value.data.length > 0
      ) {
        const shipment = BPShipmentData.value.data[0].values.reduce(
          (acc, item) => {
            acc[item.attribute] = item.value;
            return acc;
          },
          {}
        );

        const facts = [
          { title: "Shipment Number", value: shipment.s_no || "N/A" },
          { title: "ID", value: shipment.id || "N/A" },
          { title: "MBL No", value: shipment.mbl_no || "N/A" },
          { title: "HBL No", value: shipment.hbl_no || "N/A" },
          { title: "Containers", value: shipment.containers || "N/A" },
          {
            title: "Country of Import",
            value: shipment.ctry_of_import || "N/A",
          },
          { title: "Status", value: shipment.status || "N/A" },
          { title: "ISF Status", value: shipment.isf_status || "N/A" },
          { title: "ETA", value: shipment.eta || "N/A" },
          { title: "Errors", value: shipment.errors || "N/A" },
          { title: "Created Time", value: shipment.created_time || "N/A" },
          { title: "BP Version", value: shipment.bp_version || "N/A" },
          { title: "BP Tracker ID", value: shipment.bp_tracker_id || "N/A" },
        ];

        const resultCard = {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.3",
          body: [
            {
              type: "TextBlock",
              size: "Medium",
              weight: "Bolder",
              text: "Shipment Details",
              color: "Good",
            },
            {
              type: "FactSet",
              facts: facts.map((fact) => ({
                title: fact.title,
                value: fact.value,
              })),
            },
            {
              type: "TextBlock",
              text: "Search Again or Exit",
              weight: "Bolder",
              size: "Medium",
              spacing: "Medium",
            },
          ],
          actions: [
            {
              type: "Action.Submit",
              title: "Search Again",
              data: {
                action: "searchBP",
                mblNumber: mblNumber,
                hblNumber: hblNumber,
                country: country,
              },
            },
            {
              type: "Action.Submit",
              title: "Exit",
              data: { action: "exit" },
            },
          ],
        };

        await context.sendActivity({
          attachments: [CardFactory.adaptiveCard(resultCard)],
        });
      } else {
        await context.sendActivity(
          "No shipments found for the provided criteria. Please try again."
        );
        await this.showSearchBPCard(context, mblNumber, hblNumber, country);
      }
    } catch (error) {
      console.error("Error in handleSearch:", error);
      await context.sendActivity(
        "An error occurred while fetching shipment details. Please try again later."
      );
    }
  }
}

module.exports = { TeamsBot };
