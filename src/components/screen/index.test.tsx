import { render, screen } from "@testing-library/react";
import React from "react";
import Screen from './index'

describe('Screen', () => {
  it('Normal display Screen', () => {
    render(<Screen />)
    expect(screen.getByText('Apply Now')).toBeInTheDocument();
  });
})