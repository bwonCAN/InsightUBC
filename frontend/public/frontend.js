window.onload = function () {
	loadData();
};

async function loadData() {
	document.getElementById("datasetsDiv").innerHTML = "";
	const response = await fetch("http://localhost:4321/datasets")
		.then((response) => {
			if (!response.ok) {
				throw new Error(`Error: ${response.status}`);
			}
			return response.text();
		})
		.then((data) => {
			let parsedData = JSON.parse(data).result;
			console.log(parsedData);
			// console.log(parsedData.result);
			const element = document.getElementById("datasetsDiv");
			var dataCount = 0;
			for (let key in parsedData) {
				const div = document.createElement("div");
				div.style.cssText =
					"margin-left:50px; margin-right:50px;  border-color:#9b9bed;" + "padding: 10px;background-color:#dae8ed";
				const para = document.createElement("a");
				para.href = "http://localhost:4321/insights/" + parsedData[key]["id"];
				const idNode = document.createTextNode(parsedData[key]["id"]);
				// const rowsNode = document.createTextNode(parsedData[key]["numRows"]);
				para.appendChild(idNode);
				//para.appendChild(rowsNode);
				div.appendChild(para);

				var button = document.createElement("button");
				var buttonText = document.createTextNode("delete");
				button.onclick = function () {
					removeDataset(parsedData[key]["id"]);
				};
				button.style.cssText =
					"background-color: #4CAF50; color:white; padding: 10px; float: right; padding-top:5px; padding-bottom:5px; border: none; border-radius: 10px;";
				button.appendChild(buttonText);
				div.appendChild(button);

				element.appendChild(div);
				dataCount++;
			}
		})
		.catch((error) => {
			console.error("Error:", error);
		});
}

function hideAdd(element) {
	if (element.className == "hideAdd") {
		element.className = "notHidden";
		document.getElementById("addForm").style.display = "none";
	} else {
		element.className = "hideAdd";
		document.getElementById("addForm").style.display = "block";
	}
}

async function removeDataset(name) {
	const response = await fetch(`http://localhost:4321/dataset/${name}`, {
		method: "DELETE",
	})
		.then((data) => {
			alert("Dataset successfully deleted!");
			loadData();
		})
		.catch((error) => {
			console.error("Error:", error);
		});
}

document.getElementById("addDatasetButton").addEventListener("click", async () => {
	const fileInput = document.getElementById("fileInput");
	const file = fileInput.files[0];
	const idInput = document.getElementById("idInput").value;
	if (!file) {
		alert("No file selected");
		return;
	}
	const kind = "sections";

	const fileBuffer = await file.arrayBuffer();
	try {
		const response = await fetch(`http://localhost:4321/dataset/${idInput}/${kind}`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/octet-stream",
			},
			body: fileBuffer,
		});

		const result = await response.json();
		if (response.ok) {
			alert("Dataset successfully added!");
			loadData();
		} else {
			alert(`Failed to add dataset: ${result.error}`);
		}
	} catch (error) {
		console.error("Error:", error);
		alert("Error: " + error);
	}
});
