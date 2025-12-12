(function () {
  "use strict";

  const fromAppId = kintone.app.getId();
  const targetAppId = 203;
  const fieldsFromApp = [
    "create_date",
    "deposit_amount",
    "withdrawal_amount",
    "balance_amount",
    "description_amount",
    "private_note",
  ];
  console.log("Hello Kintone");

  async function getData() {
    try {
      const url = kintone.api.url("/k/v1/records", true);
      const params = {
        app: fromAppId,
      };
      const res = await kintone.api(url, "GET", params);
      if (res.records.length === 0) {
        alert("No data found.");
        return;
      }
      return res.records;
    } catch (error) {
      alert(error.message);
    }
  }

  function uniqueItem(items) {
    const map = items.reduce((acc, item) => {
      const key = item.$id.value;
      acc[key] = item;
      return acc;
    }, {});

    return Object.values(map);
  }

  async function sendDataToApp(appId, records) {
    if (!records || records.length === 0) return;
    const url = kintone.api.url("/k/v1/records", true);
    var BATCH_SIZE = 50;

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batchRecords = records.slice(i, i + BATCH_SIZE);
      const body = {
        app: appId,
        records: batchRecords,
      };
      // console.log(fromAppId, "send to app", appId);
      try {
        await kintone.api(url, "POST", body);
        // console.log("sent success");
      } catch (error) {
        console.error("Kintone Error:", JSON.stringify(error, null, 2));
      }
    }
  }

  async function updateSourceRecord(appId, record) {
    if (!record || record.length === 0) return;
    const url = kintone.api.url(`/k/v1/record`, true);
    var BATCH_SIZE = 50;

    for (let i = 0; i < record.length; i += BATCH_SIZE) {
      const batchRecords = record.slice(i, i + BATCH_SIZE);
      const body = {
        app: appId,
        records: batchRecords,
      };
      await kintone.api(url, "PUT", body);
    }
  }

  function getDataByFields(fields, record) {
    return fields.reduce((acc, field) => {
      const value = record?.[field]?.value ?? null;
      acc[field] = { value };
      return acc;
    }, {});
  }

  function createDataPayload(records) {
    return records.map((record) => getDataByFields(fieldsFromApp, record));
  }

  async function onClickMoveData() {
    try {
      const data = await getData();
      if (data.length === 0) {
        alert("No data found!");
        return;
      }
      let record = uniqueItem(data);
      if (record.length === 0) {
        alert("There is no new data to sync!");
        return;
      }
      const dataPayload = createDataPayload(record);
      console.log("==>", dataPayload);
      // await sendDataToApp(targetAppId, dataPayload);
      // await updateSourceRecord(appId, record);
    } catch (error) {
      alert(error.message);
    } finally {
      alert("Data moved successfully!");
    }
  }

  function createElementDOM() {
    const btnMoveDataId = "btn-sync-data";
    const toolbarSpace = kintone.app.getHeaderMenuSpaceElement();
    if (!toolbarSpace) return;

    if (document.getElementById(btnMoveDataId)) return;

    const btnMoveData = document.createElement("button");
    btnMoveData.id = btnMoveDataId;
    btnMoveData.innerText = "Sync to CF";
    btnMoveData.addEventListener("click", () => {
      onClickMoveData();
    });

    toolbarSpace.appendChild(btnMoveData);
  }

  kintone.events.on("app.record.index.show", function (event) {
    createElementDOM();
  });
})();
