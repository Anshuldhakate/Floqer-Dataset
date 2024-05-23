import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto'; // Import necessary for chart.js to work

const Maintable = () => {
  const [jobs, setJobs] = useState([]);
  const [sortedJobs, setSortedJobs] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'year', direction: 'ascending' });
  const [selectedYear, setSelectedYear] = useState(null);
  const [jobTitles, setJobTitles] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:7000/data`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log("Fetched data:", data); // Debugging step
        if (data && Array.isArray(data)) {
          const processedData = processJobsData(data);
          console.log("Processed data:", processedData); // Debugging step
          setJobs(processedData);
          setSortedJobs(processedData);
        } else {
          console.error("Data format is incorrect:", data);
        }
      })
      .catch(error => {
        console.error("Error fetching data:", error);
      });
  }, []);

  const processJobsData = (data) => {
    console.log("Processing data:", data); // Debugging step
    const groupedByYear = data.reduce((acc, job) => {
      if (!acc[job.work_year]) {
        acc[job.work_year] = [];
      }
      // Ensure salary_in_usd is a number and not zero
      const salary = parseFloat(job.salary_in_usd);
      if (!isNaN(salary) && salary > 0) {
        acc[job.work_year].push({ ...job, salary_in_usd: salary });
      }
      return acc;
    }, {});

    const processedData = Object.keys(groupedByYear).map(year => {
      const jobsForYear = groupedByYear[year];
      const totalJobs = jobsForYear.length;
      const averageSalary = totalJobs > 0 ? jobsForYear.reduce((sum, job) => sum + job.salary_in_usd, 0) / totalJobs : 0;

      return {
        year,
        totalJobs,
        averageSalary: averageSalary.toFixed(2)
      };
    });

    console.log("Processed job data:", processedData); // Debugging step
    return processedData;
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });

    const sortedArray = [...sortedJobs].sort((a, b) => {
      if (key === 'averageSalary') {
        // Parse average salary to float for comparison
        const aVal = parseFloat(a[key]);
        const bVal = parseFloat(b[key]);
        if (aVal < bVal) {
          return direction === 'ascending' ? -1 : 1;
        }
        if (aVal > bVal) {
          return direction === 'ascending' ? 1 : -1;
        }
      } else {
        if (a[key] < b[key]) {
          return direction === 'ascending' ? -1 : 1;
        }
        if (a[key] > b[key]) {
          return direction === 'ascending' ? 1 : -1;
        }
      }
      return 0;
    });

    setSortedJobs(sortedArray);
  };

  const handleRowClick = (year) => {
    setSelectedYear(year);
    fetch(`http://localhost:7000/data`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data && Array.isArray(data)) {
          const filteredData = data.filter(job => job.work_year === year);
          const jobTitleCount = filteredData.reduce((acc, job) => {
            if (!acc[job.job_title]) {
              acc[job.job_title] = 0;
            }
            acc[job.job_title]++;
            return acc;
          }, {});
          setJobTitles(Object.entries(jobTitleCount).map(([title, count]) => ({ title, count })));
        }
      })
      .catch(error => {
        console.error("Error fetching data:", error);
      });
  };

  const lineGraphData = {
    labels: jobs.map(job => job.year),
    datasets: [
      {
        label: 'Total Jobs',
        data: jobs.map(job => job.totalJobs),
        fill: false,
        backgroundColor: 'rgba(75,192,192,1)',
        borderColor: 'rgba(75,192,192,1)',
      },
    ],
  };

  return (
    <div>
      <h1>Main Table</h1>
      <Line data={lineGraphData} />
      <table>
        <thead>
          <tr>
            <th onClick={() => handleSort('year')}>Year {sortConfig.key === 'year' ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : ''}</th>
            <th onClick={() => handleSort('totalJobs')}>Number of Jobs {sortConfig.key === 'totalJobs' ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : ''}</th>
            <th onClick={() => handleSort('averageSalary')}>Average Salary (USD) {sortConfig.key === 'averageSalary' ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : ''}</th>
          </tr>
        </thead>
        <tbody>
          {sortedJobs.map((job, index) => (
            <tr key={index} onClick={() => handleRowClick(job.year)}>
              <td>{job.year}</td>
              <td>{job.totalJobs}</td>
              <td>{job.averageSalary}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {selectedYear && (
        <div>
          <h2>Job Titles for {selectedYear}</h2>
          <table>
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {jobTitles.map((job, index) => (
                <tr key={index}>
                  <td>{job.title}</td>
                  <td>{job.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Maintable;
