// AI was used to help create the charts/graphs

window.onload = function () {
	//loadData();
	const path = window.location.pathname;
	const id = path.split("/").pop();
	console.log(id);
	// getGradeInsightForClass("cpsc", "110", id);
};

async function getGradeInsightForClass(dept, id, dataset) {
	let query = constructAvgOverTimeQuery(dataset, dept, id);
	console.log(query);
	const queryJSON = JSON.stringify(query);
	console.log(queryJSON);
	try {
		const response = await fetch(`http://localhost:4321/query`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: queryJSON,
		});
		const data = await response.json();
		console.log(data);
		makeAverageChart(data, dataset);
		makeGradeChart(data, dataset);
	} catch (error) {
		console.error("Error sending query:", error);
		alert(`Error fetching data: ${error.message}`);
	}
}
function makeGradeChart(data, datasetName) {
	let dataset = data.result;
	dataset = dataset.slice(1);

	const margin = { top: 20, right: 30, bottom: 50, left: 50 };
	const width = 800 - margin.left - margin.right;
	const height = 400 - margin.top - margin.bottom;

	const svg = d3.select("#chart")
		.append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", `translate(${margin.left}, ${margin.top})`);

	const xScale = d3.scaleLinear()
		.domain(d3.extent(dataset, d => d[`${datasetName}_year`])) // [min, max] of years
		.range([0, width]);

	const yScale = d3.scaleLinear()
		.domain([d3.min(dataset, d => d.averageGrade) - 1, d3.max(dataset, d => d.averageGrade) + 1]) // Adjust for padding
		.range([height, 0]);

	const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
	const yAxis = d3.axisLeft(yScale);

	svg.append("g")
		.attr("transform", `translate(0, ${height})`)
		.call(xAxis)
		.append("text")
		.attr("fill", "black")
		.attr("x", width / 2)
		.attr("y", 40)
		.attr("text-anchor", "middle")
		.text("Year");

	svg.append("g")
		.call(yAxis)
		.append("text")
		.attr("fill", "black")
		.attr("x", -height / 2)
		.attr("y", -40)
		.attr("transform", "rotate(-90)")
		.attr("text-anchor", "middle")
		.text("Average Grade");
	const line = d3.line()
		.x(d => xScale(d[`${datasetName}_year`]))
		.y(d => yScale(d.averageGrade));

	svg.append("path")
		.datum(dataset)
		.attr("fill", "none")
		.attr("stroke", "steelblue")
		.attr("stroke-width", 2)
		.attr("d", line);

	const tooltip = d3.select("body").append("div")
		.style("position", "absolute")
		.style("visibility", "hidden")
		.style("background-color", "white")
		.style("border", "1px solid #ccc")
		.style("border-radius", "4px")
		.style("padding", "5px")
		.style("font-size", "12px");


	svg.selectAll(".dot")
		.data(dataset)
		.enter()
		.append("circle")
		.attr("class", "dot")
		.attr("cx", d => xScale(d[`${datasetName}_year`]))
		.attr("cy", d => yScale(d.averageGrade))
		.attr("r", 5)
		.attr("fill", "red")
		.on("mouseover", (event, d) => {
			tooltip.transition().duration(200).style("opacity", 1);
			tooltip.style("visibility", "visible").text(`Average Grade: ${d.averageGrade}`);
		})
		.on("mousemove", (event) => {
			tooltip
				.style("left", (event.pageX + 10) + "px")
				.style("top", (event.pageY - 30) + "px");
		})
		.on("mouseout", () => {
			tooltip.style("visibility", "hidden");
		});
}

function makeAverageChart(data, datasetName) {
	let dataset = data.result;
	dataset = dataset.slice(1);

	const margin = { top: 40, right: 20, bottom: 50, left: 60 },
		width = 800 - margin.left - margin.right,
		height = 500 - margin.top - margin.bottom;

	d3.select("#chart").html("");

	const svg = d3
		.select("#chart")
		.append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", `translate(${margin.left},${margin.top})`);

	const xScale = d3
		.scaleBand()
		.domain(dataset.map((d) => d[`${datasetName}_year`]))
		.range([0, width])
		.padding(0.2);

	const yScale = d3
		.scaleLinear()
		.domain([0, d3.max(dataset, (d) => d.totalPass + d.totalFail + d.totalAudit)])
		.nice()
		.range([height, 0]);

	const xAxis = d3.axisBottom(xScale);
	const yAxis = d3.axisLeft(yScale);

	svg
		.append("g")
		.attr("transform", `translate(0, ${height})`)
		.call(xAxis)
		.selectAll("text")
		.attr("transform", "rotate(-45)")
		.style("text-anchor", "end");

	svg.append("g").call(yAxis);

	const tooltip = d3
		.select("#chart")
		.append("div")
		.style("position", "absolute")
		.style("visibility", "hidden")
		.style("background-color", "white")
		.style("border", "1px solid #ccc")
		.style("border-radius", "4px")
		.style("padding", "5px")
		.style("font-size", "12px");

	svg
		.selectAll(".bar-pass")
		.data(dataset)
		.enter()
		.append("rect")
		.attr("class", "bar bar-pass")
		.attr("x", (d) => xScale(d[`${datasetName}_year`]))
		.attr("y", (d) => yScale(d.totalPass))
		.attr("width", xScale.bandwidth() / 3)
		.attr("height", (d) => height - yScale(d.totalPass))
		.attr("fill", "green")
		.on("mouseover", function (event, d) {
			tooltip.style("visibility", "visible").text(`Pass: ${d.totalPass}`);
			d3.select(this).attr("fill", "darkgreen");
		})
		.on("mousemove", function (event) {
			tooltip.style("top", `${event.pageY - 10}px`).style("left", `${event.pageX + 10}px`);
		})
		.on("mouseout", function () {
			tooltip.style("visibility", "hidden");
			d3.select(this).attr("fill", "green");
		});


	svg
		.selectAll(".bar-fail")
		.data(dataset)
		.enter()
		.append("rect")
		.attr("class", "bar bar-fail")
		.attr("x", (d) => xScale(d[`${datasetName}_year`]) + xScale.bandwidth() / 3)
		.attr("y", (d) => yScale(d.totalFail))
		.attr("width", xScale.bandwidth() / 3)
		.attr("height", (d) => height - yScale(d.totalFail))
		.attr("fill", "red")
		.on("mouseover", function (event, d) {
			tooltip.style("visibility", "visible").text(`Fail: ${d.totalFail}`);
			d3.select(this).attr("fill", "darkred");
		})
		.on("mousemove", function (event) {
			tooltip.style("top", `${event.pageY - 10}px`).style("left", `${event.pageX + 10}px`);
		})
		.on("mouseout", function () {
			tooltip.style("visibility", "hidden");
			d3.select(this).attr("fill", "red");
		});
	svg
		.selectAll(".bar-audit")
		.data(dataset)
		.enter()
		.append("rect")
		.attr("class", "bar bar-audit")
		.attr("x", (d) => xScale(d[`${datasetName}_year`]) + (2 * xScale.bandwidth()) / 3)
		.attr("y", (d) => yScale(d.totalAudit))
		.attr("width", xScale.bandwidth() / 3)
		.attr("height", (d) => height - yScale(d.totalAudit))
		.attr("fill", "blue")
		.on("mouseover", function (event, d) {
			tooltip.style("visibility", "visible").text(`Audit Rate: ${d.totalAudit}`);
			d3.select(this).attr("fill", "darkblue");
		})
		.on("mousemove", function (event) {
			tooltip.style("top", `${event.pageY - 10}px`).style("left", `${event.pageX + 10}px`);
		})
		.on("mouseout", function () {
			tooltip.style("visibility", "hidden");
			d3.select(this).attr("fill", "blue");
		});
	svg
		.append("text")
		.attr("x", width / 2)
		.attr("y", height + margin.bottom - 10)
		.attr("text-anchor", "middle")
		.attr("class", "axis-label")
		.text("Year");

	svg
		.append("text")
		.attr("transform", "rotate(-90)")
		.attr("x", -height / 2)
		.attr("y", -margin.left + 15)
		.attr("text-anchor", "middle")
		.attr("class", "axis-label")
		.text("Number of Students");

	svg
		.append("rect")
		.attr("x", width - 120)
		.attr("y", 10)
		.attr("width", 12)
		.attr("height", 12)
		.style("fill", "green");
	svg
		.append("text")
		.attr("x", width - 100)
		.attr("y", 20)
		.text("Pass")
		.style("alignment-baseline", "middle");

	svg
		.append("rect")
		.attr("x", width - 120)
		.attr("y", 30)
		.attr("width", 12)
		.attr("height", 12)
		.style("fill", "red");
	svg
		.append("text")
		.attr("x", width - 100)
		.attr("y", 40)
		.text("Fail")
		.style("alignment-baseline", "middle");
	svg
		.append("rect")
		.attr("x", width - 120)
		.attr("y", 50)
		.attr("width", 12)
		.attr("height", 12)
		.style("fill", "blue");
	svg
		.append("text")
		.attr("x", width - 100)
		.attr("y", 60)
		.text("Audit")
		.style("alignment-baseline", "middle");
}

document.getElementById("queryButton").addEventListener("click", () => {
	const path = window.location.pathname;
	const datasetId = path.split("/").pop();
	let dept = document.getElementById("dept").value;
	let Id = document.getElementById("classId").value;

	getGradeInsightForClass(dept, "" + Id, datasetId);
});

function constructAvgOverTimeQuery(datasetName, department, id) {
	// let department = "cpsc";
	// let id = "110";
	const query = {
		WHERE: {
			AND: [
				{
					IS: {
						[`${datasetName}_dept`]: department,
					},
				},
				{
					IS: {
						[`${datasetName}_id`]: id,
					},
				},
			],
		},
		OPTIONS: {
			COLUMNS: [`${datasetName}_year`, "averageGrade", "totalPass", "totalFail", "totalAudit"],
			ORDER: {
				dir: "UP",
				keys: [`${datasetName}_year`],
			},
		},
		TRANSFORMATIONS: {
			GROUP: [`${datasetName}_year`],
			APPLY: [
				{
					averageGrade: {
						AVG: `${datasetName}_avg`,
					},
				},
				{
					totalPass: {
						SUM: `${datasetName}_pass`,
					},
				},
				{
					totalFail: {
						SUM: `${datasetName}_fail`,
					},
				},
				{
					totalAudit: {
						SUM: `${datasetName}_audit`
					}
				}
			],
		},
	};
	return query;
}

async function getSectionsAboveThreshold(datasetName, gradeThreshold) {
	const query = constructSectionsAboveThresholdQuery(datasetName, gradeThreshold);
	const queryJSON = JSON.stringify(query);

	try {
		const response = await fetch(`http://localhost:4321/query`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: queryJSON,
		});
		const data = await response.json();
		makeThresholdChart(data, datasetName);
	} catch (error) {
		console.error("Error sending query:", error);
		alert(`Error fetching data: ${error.message}`);
	}
}

function constructSectionsAboveThresholdQuery(datasetName, gradeThreshold) {
	return {
		WHERE: {
			GT: {
				[`${datasetName}_avg`]: parseFloat(gradeThreshold),
			},
		},
		OPTIONS: {
			COLUMNS: [`${datasetName}_dept`, "sectionCount"],
			ORDER: {
				dir: "UP",
				keys: [`${datasetName}_dept`],
			},
		},
		TRANSFORMATIONS: {
			GROUP: [`${datasetName}_dept`],
			APPLY: [
				{
					sectionCount: {
						COUNT: `${datasetName}_id`,
					},
				},
			],
		},
	};
}

function makeThresholdChart(data, datasetName) {
	const dataset = data.result;

	const margin = { top: 40, right: 20, bottom: 100, left: 60 },
		defaultWidth = 800,
		height = 500 - margin.top - margin.bottom,
		barWidth = 40;

	const dynamicWidth = Math.max(defaultWidth, dataset.length * barWidth);

	d3.select("#chartThreshold").html("");

	const container = d3.select("#chartThreshold").style("display", "flex").style("overflow-x", "scroll");

	const yAxisContainer = container
		.append("div")
		.style("flex", "0 0 auto")
		.style("position", "sticky")
		.style("left", "0px")
		.style("background-color", "white");

	const chartContainer = container
		.append("div")
		.style("flex", "1 0 auto")
		.style("width", `${dynamicWidth + margin.left + margin.right}px`);

	const svg = chartContainer
		.append("svg")
		.attr("width", dynamicWidth + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom);

	const chartGroup = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

	const xScale = d3
		.scaleBand()
		.domain(dataset.map((d) => d[`${datasetName}_dept`]))
		.range([0, dynamicWidth])
		.padding(0.2);

	const yScale = d3
		.scaleLinear()
		.domain([0, d3.max(dataset, (d) => d.sectionCount)])
		.nice()
		.range([height, 0]);

	const yAxisSvg = yAxisContainer
		.append("svg")
		.attr("width", margin.left)
		.attr("height", height + margin.top + margin.bottom);

	yAxisSvg
		.append("g")
		.attr("transform", `translate(${margin.left - 1},${margin.top})`)
		.call(d3.axisLeft(yScale));

	chartGroup
		.append("g")
		.attr("transform", `translate(0, ${height})`)
		.call(d3.axisBottom(xScale))
		.selectAll("text")
		.attr("transform", "rotate(-45)")
		.style("text-anchor", "end")
		.style("font-size", "10px");

	const tooltip = d3
		.select("#chartThreshold")
		.append("div")
		.style("position", "absolute")
		.style("visibility", "hidden")
		.style("background-color", "white")
		.style("border", "1px solid #ccc")
		.style("border-radius", "4px")
		.style("padding", "5px")
		.style("font-size", "12px");

	chartGroup
		.selectAll(".bar")
		.data(dataset)
		.enter()
		.append("rect")
		.attr("class", "bar")
		.attr("x", (d) => xScale(d[`${datasetName}_dept`]))
		.attr("y", (d) => yScale(d.sectionCount))
		.attr("width", xScale.bandwidth())
		.attr("height", (d) => height - yScale(d.sectionCount))
		.attr("fill", "blue")
		.on("mouseover", function (event, d) {
			tooltip.style("visibility", "visible").text(`Courses: ${d.sectionCount}`);
			d3.select(this).attr("fill", "darkblue");
		})
		.on("mousemove", function (event) {
			tooltip.style("top", `${event.pageY - 10}px`).style("left", `${event.pageX + 10}px`);
		})
		.on("mouseout", function () {
			tooltip.style("visibility", "hidden");
			d3.select(this).attr("fill", "blue");
		});

	chartGroup
		.append("text")
		.attr("x", dynamicWidth / 2)
		.attr("y", height + margin.bottom - 20)
		.attr("text-anchor", "middle")
		.attr("class", "axis-label")
		.text("Department");

	yAxisSvg
		.append("text")
		.attr("transform", "rotate(-90)")
		.attr("x", -height / 2)
		.attr("y", margin.left / 4)
		.attr("text-anchor", "middle")
		.attr("class", "axis-label")
		.text("Number of Courses");
}

document.getElementById("gradeThresholdButton").addEventListener("click", () => {
	const path = window.location.pathname;
	const datasetName = path.split("/").pop();
	const gradeThreshold = document.getElementById("gradeThreshold").value;

	if (!gradeThreshold) {
		alert("Please enter a grade threshold.");
		return;
	}

	getSectionsAboveThreshold(datasetName, gradeThreshold);
});

// Event listener for the "Apply Sort" button // Brian User Story 1
document.getElementById("applySortButton").addEventListener("click", async (event) => {
	event.preventDefault(); // Prevent default form submission behavior

	// Get the selected sorting metric and order
	const metric = document.getElementById("sortMetric").value;
	const order = document.getElementById("sortOrder").value;

	// Extract the dataset name from the URL path
	const path = window.location.pathname;
	const datasetName = path.split("/").pop();

	// Construct the query to fetch raw data
	const query = {
		WHERE: {}, // No filters applied, fetch all sections
		OPTIONS: {
			COLUMNS: [
				`${datasetName}_dept`,
				`${datasetName}_id`,
				`${datasetName}_pass`,
				`${datasetName}_fail`,
				`${datasetName}_avg`,
			],
		},
	};

	try {
		// Send the query to the backend
		const response = await fetch("http://localhost:4321/query", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(query),
		});

		const data = await response.json();

		if (response.ok) {
			// Combine sections into single courses and calculate metrics
			const combinedResults = combineSections(data.result, datasetName);

			// Sort the combined results by the selected metric
			const sortedResults = sortResults(combinedResults, metric, order);

			// Notify the user if results are truncated
			if (sortedResults.length === 5000 && combinedResults.length > 5000) {
				alert("Results truncated to the first 5000 entries for performance.");
			}

			// Populate the sorted results in the sortedResultsDiv
			displaySortedResults(sortedResults, datasetName, metric);
		} else {
			alert(`Error: ${data.error}`);
		}
	} catch (error) {
		alert(`Failed to send query: ${error.message}`);
	}
});

// Function to combine sections into single courses
function combineSections(results, datasetName) {
	const combined = {};

	results.forEach((row) => {
		const courseKey = `${row[`${datasetName}_dept`]} ${row[`${datasetName}_id`]}`;

		if (!combined[courseKey]) {
			combined[courseKey] = {
				department: row[`${datasetName}_dept`],
				classId: row[`${datasetName}_id`],
				totalPass: 0,
				totalFail: 0,
				totalAvg: 0,
				sectionCount: 0,
			};
		}

		combined[courseKey].totalPass += row[`${datasetName}_pass`];
		combined[courseKey].totalFail += row[`${datasetName}_fail`];
		combined[courseKey].totalAvg += row[`${datasetName}_avg`];
		combined[courseKey].sectionCount += 1;
	});

	return Object.values(combined).map((course) => ({
		department: course.department,
		classId: course.classId,
		averageGrade: course.totalAvg / course.sectionCount,
		passRate: (course.totalPass / (course.totalPass + course.totalFail)) * 100 || 0,
		failRate: (course.totalFail / (course.totalPass + course.totalFail)) * 100 || 0,
	}));
}

// Function to sort results by the selected metric
function sortResults(results, metric, order) {
	return results.sort((a, b) => {
		let comparison = 0;

		// Handle sorting based on the selected metric
		if (metric === "sections_pass") {
			comparison = a.passRate - b.passRate;
		} else if (metric === "sections_fail") {
			comparison = a.failRate - b.failRate;
		} else if (metric === "sections_avg") {
			comparison = a.averageGrade - b.averageGrade;
		}

		// Adjust for ascending/descending order
		return order === "UP" ? comparison : -comparison;
	});
}

// Function to display sorted results in the DOM
function displaySortedResults(results, datasetName, metric) {
	const resultsDiv = document.getElementById("sortedResultsDiv");

	// Clear previous results
	resultsDiv.innerHTML = `
    <h3>Sorted Results:</h3>
    <table>
      <thead>
        <tr>
          <th>Department</th>
          <th>Course Number</th>
          <th>Average Grade</th>
          <th>Pass Rate (%)</th>
          <th>Fail Rate (%)</th>
        </tr>
      </thead>
      <tbody>
        ${results
					.map((row) => {
						const passRate = row.passRate.toFixed(2) + "%";
						const failRate = row.failRate.toFixed(2) + "%";
						const avgGrade = row.averageGrade.toFixed(2);

						return `
            <tr>
              <td>${row.department}</td>
              <td>${row.classId}</td>
              <td>${avgGrade}</td>
              <td>${passRate}</td>
              <td>${failRate}</td>
            </tr>`;
					})
					.join("")}
      </tbody>
    </table>`;
}

// Event listener for the "Apply Filter" button
document.getElementById("applyInstructorFilterButton").addEventListener("click", async () => {
	const instructorName = document.getElementById("instructorName").value.trim();

	// Ensure instructor name is not empty
	if (!instructorName) {
		alert("Please enter an instructor name.");
		return;
	}

	// Extract the dataset name from the URL path
	const path = window.location.pathname;
	const datasetName = path.split("/").pop();

	// Construct the query for filtering by instructor name
	const query = {
		WHERE: {
			IS: {
				[`${datasetName}_instructor`]: `*${instructorName}*`, // Match partial names, case insensitive
			},
		},
		OPTIONS: {
			COLUMNS: [
				`${datasetName}_dept`,
				`${datasetName}_id`,
				`${datasetName}_instructor`,
				`${datasetName}_pass`,
				`${datasetName}_fail`,
				`${datasetName}_avg`,
			],
		},
	};

	try {
		// Send the query to the backend
		const response = await fetch("http://localhost:4321/query", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(query),
		});

		const data = await response.json();

		if (response.ok) {
			// Display the filtered results
			if (data.result.length > 0) {
				displayFilteredResults(data.result, datasetName);
			} else {
				alert("No sections found for the given instructor.");
			}
		} else {
			alert(`Error: ${data.error}`);
		}
	} catch (error) {
		alert(`Failed to send query: ${error.message}`);
	}
});

// Function to display filtered results in the DOM
function displayFilteredResults(results, datasetName) {
	const resultsDiv = document.getElementById("sortedResultsDiv");

	// Clear previous results
	resultsDiv.innerHTML = `
    <h3>Filtered Results:</h3>
    <table>
      <thead>
        <tr>
          <th>Department</th>
          <th>Course Number</th>
          <th>Instructor</th>
          <th>Average Grade</th>
          <th>Pass Rate (%)</th>
          <th>Fail Rate (%)</th>
        </tr>
      </thead>
      <tbody>
        ${results
					.map((row) => {
						const total = row[`${datasetName}_pass`] + row[`${datasetName}_fail`];
						const passRate = total > 0 ? ((row[`${datasetName}_pass`] / total) * 100).toFixed(2) + "%" : "0.00%";
						const failRate = total > 0 ? ((row[`${datasetName}_fail`] / total) * 100).toFixed(2) + "%" : "0.00%";
						const avgGrade = row[`${datasetName}_avg`] !== undefined ? row[`${datasetName}_avg`].toFixed(2) : "N/A";

						return `
            <tr>
              <td>${row[`${datasetName}_dept`] || "N/A"}</td>
              <td>${row[`${datasetName}_id`] || "N/A"}</td>
              <td>${row[`${datasetName}_instructor`] || "N/A"}</td>
              <td>${avgGrade}</td>
              <td>${passRate}</td>
              <td>${failRate}</td>
            </tr>`;
					})
					.join("")}
      </tbody>
    </table>`;
}

// Event listener for the "Reset Filters" button
document.getElementById("resetFiltersButton").addEventListener("click", () => {
	location.reload(); // Reloads the current page
});
