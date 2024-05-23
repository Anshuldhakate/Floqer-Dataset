import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import styled from 'styled-components';

// Styled components
const Container = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;

  @media (max-width: 768px) {
    padding: 10px;
  }
`;

const Title = styled.h1`
  text-align: center;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const TableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
  margin-bottom: 20px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
  border: 2px solid lightteal;

  @media (max-width: 768px) {
    min-width: 100%;
  }
`;

const TableHeader = styled.th`
  cursor: pointer;
  padding: 10px;
  background-color: lightgreen;
  border: 2px solid lightgreen;

  @media (max-width: 768px) {
    padding: 8px;
    font-size: 0.9rem;
  }
`;

const TableRow = styled.tr`
  &:nth-child(even) {
    background-color: #e7f4e7;
  }
  &:hover {
    background-color: #f1f1f1;
  }
`;

const TableCell = styled.td`
  padding: 10px;
  border: 1px solid #ddd;
  text-align: center;

  @media (max-width: 768px) {
    padding: 8px;
    font-size: 0.9rem;
  }
`;

const SubTitle = styled.h2`
  text-align: center;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`;

const GraphWrapper = styled.div`
  width: 100%;
  max-width: 800px;
  margin-bottom: 20px;
 

  @media (max-width: 768px) {
    max-width: 100%;
  }
`;

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
        if (data && Array.isArray(data)) {
          const processedData = processJobsData(data);
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
    const groupedByYear = data.reduce((acc, job) => {
      if (!acc[job.work_year]) {
        acc[job.work_year] = [];
      }
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

  const getSortSymbol = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? '↑' : '↓';
    }
    return '';
  };

  return (
    <Container>
      <Title>Main Table</Title>
      
      <TableWrapper>
        <Table>
          <thead>
            <tr>
              <TableHeader onClick={() => handleSort('year')}>
                Year {getSortSymbol('year')}
              </TableHeader>
              <TableHeader onClick={() => handleSort('totalJobs')}>
                Number of Jobs {getSortSymbol('totalJobs')}
              </TableHeader>
              <TableHeader onClick={() => handleSort('averageSalary')}>
                Average Salary (USD) {getSortSymbol('averageSalary')}
              </TableHeader>
            </tr>
          </thead>
          <tbody>
            {sortedJobs.map((job, index) => (
              <TableRow key={index} onClick={() => handleRowClick(job.year)}>
                <TableCell>{job.year}</TableCell>
                <TableCell>{job.totalJobs}</TableCell>
                <TableCell>{job.averageSalary}</TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </TableWrapper>

      <GraphWrapper>
        <Line data={lineGraphData} />
      </GraphWrapper>
      
      {selectedYear && (
        <div>
          <SubTitle>Job Titles for {selectedYear}</SubTitle>
          <TableWrapper>
            <Table>
              <thead>
                <tr>
                  <TableHeader>Job Title</TableHeader>
                  <TableHeader>No. Of Jobs</TableHeader>
                </tr>
              </thead>
              <tbody>
                {jobTitles.map((job, index) => (
                  <TableRow key={index}>
                    <TableCell>{job.title}</TableCell>
                    <TableCell>{job.count}</TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          </TableWrapper>
        </div>
      )}
    </Container>
  );
};

export default Maintable;
