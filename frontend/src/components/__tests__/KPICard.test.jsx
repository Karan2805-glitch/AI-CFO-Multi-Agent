import { render, screen } from '@testing-library/react';
import KPICard from '../dashboard/KPICard';

describe('KPICard Component', () => {
  it('renders the title and value correctly', () => {
    render(<KPICard label="Revenue" value={10000} />);
    
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('$10.0k')).toBeInTheDocument(); // formatted value based on KPICard.jsx (>=1000 format)
  });

  it('renders a trend if provided', () => {
    render(<KPICard label="Profit" value={5000} trend={1} trendLabel="+5%" />);
    
    expect(screen.getByText('+5%')).toBeInTheDocument();
  });
});
