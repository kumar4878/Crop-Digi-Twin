import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App Layout Rendering', () => {
    it('should successfully mount the application and render the sidebar', () => {
        render(<App />);
        // Checking if the Sidebar or Navigation renders properly
        // Based on typical Farmer portals, there is an Integrations link or Settings link
        expect(screen.getByText(/Settings|Dashboard/i)).toBeInTheDocument();
    });
});
