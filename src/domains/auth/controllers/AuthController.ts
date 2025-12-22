// This file now delegates to the modular auth system
import { AuthController as ModularAuthController } from '../../../shared/auth';

// Re-export the modular auth controller for backward compatibility
export class AuthController extends ModularAuthController {
  constructor() {
    super();
  }
}

// Export default instance for easy import
export default new AuthController();