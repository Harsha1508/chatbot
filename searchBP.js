const { CardFactory } = require("botbuilder");
const { fetchBPShipmentService } = require("./axios/BPShipmentService.js");

async function searchBP(context, mblNumber, hblNumber, country) {
  const payload = {
    filterData: [
      { attribute: "mbl_no", values: [mblNumber.trim()] },
      { attribute: "HBL_No", values: [hblNumber.trim()] },
      { attribute: "CTRY_OF_IMPORT", values: [country.trim()] },
    ],
    pageNo: 0,
    pageSize: 10,
  };

  try {
    console.log("Sending payload:", JSON.stringify(payload, null, 2));

    const response = await fetchBPShipmentService(payload);

    if (
      response &&
      response.status === 200 &&
      response.value &&
      response.value.data.length > 0
    ) {
      const shipment = response.value.data[0].values.reduce((acc, item) => {
        acc[item.attribute] = item.value;
        return acc;
      }, {});

      const facts = [
        { title: "Shipment Number", value: shipment.s_no || "N/A" },
        { title: "ID", value: shipment.id || "N/A" },
        { title: "MBL No", value: shipment.mbl_no || "N/A" },
        { title: "HBL No", value: shipment.hbl_no || "N/A" },
        { title: "Containers", value: shipment.containers || "N/A" },
        { title: "Country of Import", value: shipment.ctry_of_import || "N/A" },
        { title: "Status", value: shipment.status || "N/A" },
        { title: "ISF Status", value: shipment.isf_status || "N/A" },
        { title: "ETA", value: shipment.eta || "N/A" },
        { title: "Errors", value: shipment.errors || "N/A" },
        { title: "Created Time", value: shipment.created_time || "N/A" },
        { title: "BP Version", value: shipment.bp_version || "N/A" },
        { title: "BP Tracker ID", value: shipment.bp_tracker_id || "N/A" },
      ];

      const card = {
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
        ],
        actions: [
          {
            type: "Action.Submit",
            title: "Search Again",
            data: { action: "searchAgain" },
          },
          {
            type: "Action.Submit",
            title: "Exit",
            data: { action: "exit" },
          },
        ],
      };

      await context.sendActivity({
        attachments: [CardFactory.adaptiveCard(card)],
      });
    } else {
      await context.sendActivity(
        "No shipments found for the provided criteria."
      );
    }
  } catch (error) {
    console.error("Error in searchBP:", error);
    await context.sendActivity(
      "An error occurred while fetching shipment details. Please try again later."
    );
  }
}

module.exports = { searchBP };
