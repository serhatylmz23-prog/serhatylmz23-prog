import type { AgentId, SyAgent } from '../agentTypes';

import { geologyAgent } from './geologyAgent';

import { archaeologyAgent } from './archaeologyAgent';

import { seismicAgent } from './seismicAgent';

import { weatherAgent } from './weatherAgent';

import { satelliteAgent } from './satelliteAgent';

export const agentRegistry:
  Record<AgentId, SyAgent> = {
    jeoloji: geologyAgent,
    arkeoloji: archaeologyAgent,
    sismoloji: seismicAgent,
    meteoroloji: weatherAgent,
    uydu: satelliteAgent,
  };

export function getAllAgents(): SyAgent[] {
  return Object.values(
    agentRegistry
  );
}