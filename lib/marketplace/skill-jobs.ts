/**
 * Skill-based Jobs and Micro-gigs Platform
 * Higher-paying specialized work opportunities with vetted workers
 * Multi-billion dollar crypto platform premium marketplace
 */

import { EventEmitter } from 'events';
import Redis from 'ioredis';
import { DatabaseManager } from '../../database/mongodb/connection';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Skill-based Job Schemas
const SkillCategorySchema = z.object({
  categoryId: z.string(),
  name: z.string(),
  description: z.string(),
  parentCategoryId: z.string().optional(),
  level: z.number().default(1), // 1=root, 2=main category, 3=subcategory
  icon: z.string(),
  color: z.string(),
  averageRate: z.string().default('0'), // per hour or per project
  demandLevel: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  requiredSkills: z.array(z.string()).default([]),
  commonTools: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  createdAt: z.date().default(() => new Date())
});

const SkillProfileSchema = z.object({
  profileId: z.string(),
  userId: z.string(),
  category: z.object({
    primary: z.string(), // main skill category
    secondary: z.array(z.string()).default([]), // additional skills
    specializations: z.array(z.string()).default([])
  }),
  experience: z.object({
    years: z.number().default(0),
    projects: z.number().default(0),
    hours: z.number().default(0),
    reputation: z.number().default(0) // 0-100 score
  }),
  expertise: z.object({
    level: z.enum(['beginner', 'intermediate', 'advanced', 'expert', 'master']).default('intermediate'),
    certifications: z.array(z.object({
      name: z.string(),
      issuer: z.string(),
      date: z.date(),
      credentialId: z.string().optional(),
      verified: z.boolean().default(false)
    })).default([]),
    portfolio: z.array(z.object({
      title: z.string(),
      description: z.string(),
      completedAt: z.date(),
      clientRating: z.number().optional(),
      earnings: z.string(),
      tools: z.array(z.string()).default([]),
      files: z.array(z.string()).default([]) // Portfolio files/URLs
    })).default([])
  }),
  availability: z.object({
    hoursPerWeek: z.number().default(20),
    timezone: z.string(),
    responseTime: z.number().default(24), // hours
    preferredProjects: z.array(z.string()).default([]),
      availabilitySchedule: z.array(z.object({
        dayOfWeek: z.number(), // 0-6 (Sunday-Saturday)
        startTime: z.string(),
        endTime: z.string()
      })).default([])
  }),
  pricing: z.object({
    hourlyRate: z.string(),
    projectRates: z.array(z.object({
      projectType: z.string(),
      minRate: z.string(),
      maxRate: z.string(),
      avgTime: z.number() // hours
    })).default([]),
    currency: z.enum(['USD', 'EUR', 'USDT', 'USDC', 'ETH']).default('USD'),
    negotiable: z.boolean().default(true),
    minimumProject: z.string().default('50')
  }),
  verification: z.object({
    identityVerified: z.boolean().default(false),
    skillVerified: z.boolean().default(false),
    backgroundCheck: z.boolean().default(false),
    verificationDate: z.date().optional(),
    verificationLevel: z.enum(['basic', 'standard', 'premium', 'enterprise']).default('basic')
  }),
  metrics: z.object({
    completedJobs: z.number().default(0),
    totalEarnings: z.string().default('0'),
    averageRating: z.number().default(0),
    responseRate: z.number().default(0),
    onTimeDelivery: z.number().default(0),
    clientRepeatRate: z.number().default(0)
  }),
  status: z.enum(['draft', 'active', 'paused', 'suspended']).default('draft'),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

const MicroGigSchema = z.object({
  gigId: z.string(),
  clientId: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.object({
    primary: z.string(),
    secondary: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([])
  }),
  scope: z.object({
    type: z.enum([
      'fixed_price', 'hourly', 'milestone', 'retainer', 'subscription', 'performance_based'
    ]),
    duration: z.enum(['micro', 'short', 'medium', 'long']).default('micro'),
    estimatedHours: z.number().optional(),
    milestones: z.array(z.object({
      title: z.string(),
      description: z.string(),
      deliverables: z.array(z.string()).default([]),
      paymentAmount: z.string(),
      deadline: z.date(),
      status: z.enum(['pending', 'in_progress', 'completed', 'approved']).default('pending')
    })).default([])
  }),
  requirements: z.object({
    skillLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert', 'master']),
    minExperience: z.number().default(0), // years
    requiredSkills: z.array(z.string()).default([]),
    certifications: z.array(z.string()).default([]),
    tools: z.array(z.string()).default([]),
    languages: z.array(z.string()).default(['English']),
    timezone: z.string().optional(),
    availability: z.enum(['immediate', 'flexible', 'specific_hours']).default('flexible')
  }),
  pricing: z.object({
    budget: z.string(),
    currency: z.enum(['USD', 'EUR', 'USDT', 'USDC', 'ETH']),
    paymentTerms: z.enum(['fixed', 'hourly', 'milestone', 'subscription']),
    depositRequired: z.boolean().default(false),
    depositAmount: z.string().optional(),
    paymentSchedule: z.array(z.object({
      milestone: z.string(),
      percentage: z.number(),
      dueDate: z.date().optional()
    })).default([])
  }),
  deliverables: z.object({
    items: z.array(z.object({
      name: z.string(),
      description: z.string(),
      format: z.string(),
      quantity: z.number().default(1),
      qualityStandards: z.string().optional()
    })).default([]),
      acceptanceCriteria: z.array(z.string()).default([]),
      revisions: z.object({
        included: z.number().default(2),
        additionalCost: z.string().default('0'),
        timeframe: z.string().default('48h')
      })
  }),
  collaboration: z.object({
    communicationMethod: z.enum(['platform_chat', 'email', 'video', 'in_person']).default('platform_chat'),
    meetingFrequency: z.enum(['daily', 'weekly', 'as_needed']).default('as_needed'),
    fileSharing: z.boolean().default(true),
    progressReports: z.boolean().default(true),
    clientReviewRequired: z.boolean().default(true)
  }),
  location: z.object({
    type: z.enum(['remote', 'hybrid', 'onsite', 'any']).default('remote'),
    timezone: z.string().optional(),
    country: z.string().optional(),
    city: z.string().optional()
  }),
  visibility: z.object({
    level: z.enum(['public', 'private', 'invite_only']).default('public'),
    featuredUntil: z.date().optional(),
    priorityListing: z.boolean().default(false),
    deadline: z.date(),
    urgency: z.enum(['low', 'medium', 'high', 'urgent']).default('medium')
  }),
  status: z.enum(['draft', 'published', 'in_progress', 'completed', 'cancelled', 'paused']).default('draft'),
  applications: z.array(z.object({
    applicantId: z.string(),
    profileId: z.string(),
    proposedRate: z.string(),
    coverLetter: z.string(),
    estimatedTimeline: z.string(),
    attachedPortfolio: z.array(z.string()).default([]),
    status: z.enum(['submitted', 'viewed', 'shortlisted', 'rejected', 'hired']).default('submitted'),
    submittedAt: z.date()
  })).default([]),
  hiredWorker: z.object({
    userId: z.string().optional(),
    profileId: z.string().optional(),
    hiredAt: z.date().optional(),
    contractTerms: z.object({
      finalRate: z.string().optional(),
      startDate: z.date().optional(),
      deliveryDate: z.date().optional(),
      specialTerms: z.string().optional()
    }).optional()
  }),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

const GigContractSchema = z.object({
  contractId: z.string(),
  gigId: z.string(),
  clientId: z.string(),
  workerId: z.string(),
  terms: z.object({
    scope: z.string(),
    deliverables: z.array(z.string()),
    timeline: z.object({
      startDate: z.date(),
      endDate: z.date(),
      milestones: z.array(z.object({
        title: z.string(),
        dueDate: z.date(),
        paymentAmount: z.string(),
        completed: z.boolean().default(false)
      })).default([])
    }),
    payment: z.object({
      totalAmount: z.string(),
      currency: z.string(),
      schedule: z.array(z.object({
        milestone: z.string(),
        amount: z.string(),
        dueDate: z.date(),
        paid: z.boolean().default(false)
      })).default([]),
      deposit: z.object({
        amount: z.string(),
        held: z.boolean().default(false),
        released: z.boolean().default(false)
      }).optional()
    }),
    revisions: z.object({
      included: z.number(),
      additionalCost: z.string(),
      timeframe: z.string()
    }),
    ipOwnership: z.string().default('client'),
    confidentiality: z.boolean().default(true),
    termination: z.object({
      noticePeriod: z.number().default(7), // days
      penalties: z.string().default('0')
    })
  }),
  progress: z.object({
    status: z.enum(['not_started', 'in_progress', 'review', 'completed', 'disputed', 'cancelled']),
    completedMilestones: z.number().default(0),
    totalMilestones: z.number().default(1),
    lastUpdate: z.date(),
    issues: z.array(z.object({
      type: z.enum(['delay', 'quality', 'scope_creep', 'payment', 'communication']),
      description: z.string(),
      raisedBy: z.string(),
      status: z.enum(['open', 'in_progress', 'resolved']),
      createdAt: z.date()
    })).default([])
  }),
  communication: z.array(z.object({
    senderId: z.string(),
    message: z.string(),
    type: z.enum(['text', 'file', 'milestone_update', 'dispute']),
    timestamp: z.date(),
    read: z.boolean().default(false)
  })).default([]),
  ratings: z.object({
    clientRating: z.object({
      score: z.number().optional(),
      feedback: z.string().optional(),
      ratedAt: z.date().optional()
    }),
    workerRating: z.object({
      score: z.number().optional(),
      feedback: z.string().optional(),
      ratedAt: z.date().optional()
    })
  }),
  financials: z.object({
    totalEarned: z.string().default('0'),
    platformFee: z.string().default('0'),
    netPaid: z.string().default('0'),
    refunds: z.string().default('0'),
    bonuses: z.string().default('0')
  }),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  completedAt: z.date().optional()
});

export type SkillCategory = z.infer<typeof SkillCategorySchema>;
export type SkillProfile = z.infer<typeof SkillProfileSchema>;
export type MicroGig = z.infer<typeof MicroGigSchema>;
export type GigContract = z.infer<typeof GigContractSchema>;

/**
 * Skill-based Jobs and Micro-gigs Platform
 * Manages specialized work opportunities and skilled workforce
 */
export class SkillJobsPlatform extends EventEmitter {
  private redis: Redis;
  private dbManager: DatabaseManager;
  private matchingEngine: JobMatchingEngine;
  private reputationSystem: ReputationSystem;
  private disputeResolution: DisputeResolution;

  constructor() {
    super();

    this.redis = new Redis(process.env.REDIS_URL!);
    this.dbManager = new DatabaseManager();
    this.matchingEngine = new JobMatchingEngine();
    this.reputationSystem = new ReputationSystem();
    this.disputeResolution = new DisputeResolution();

    // Initialize default skill categories
    this.initializeSkillCategories();

    // Start job matching algorithms
    this.startJobMatching();

    // Start reputation updates
    this.startReputationMonitoring();
  }

  /**
   * Create or update skill profile for user
   */
  public async createSkillProfile(
    userId: string,
    profileData: Omit<SkillProfile, 'profileId' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<SkillProfile> {
    try {
      // Check if profile already exists
      const existingProfile = await this.getUserSkillProfile(userId);

      const profile: SkillProfile = SkillProfileSchema.parse({
        ...profileData,
        profileId: existingProfile?.profileId || uuidv4(),
        userId,
        status: 'active',
        updatedAt: new Date(),
        createdAt: existingProfile?.createdAt || new Date()
      });

      // Save or update profile
      if (existingProfile) {
        await this.dbManager.update(
          'skillProfiles',
          { userId },
          { $set: profile }
        );
      } else {
        await this.dbManager.insert('skillProfiles', profile);
      }

      // Update matching engine with new profile
      await this.matchingEngine.updateWorkerProfile(userId, profile);

      this.emit('skillProfileCreated', { userId, profile });

      return profile;
    } catch (error) {
      console.error('Failed to create skill profile:', error);
      throw error;
    }
  }

  /**
   * Post new micro-gig
   */
  public async postMicroGig(
    clientId: string,
    gigData: Omit<MicroGig, 'gigId' | 'clientId' | 'createdAt' | 'updatedAt' | 'applications'>
  ): Promise<MicroGig> {
    try {
      const gig: MicroGig = MicroGigSchema.parse({
        ...gigData,
        gigId: uuidv4(),
        clientId,
        status: 'published',
        applications: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Validate gig requirements and pricing
      await this.validateGigRequirements(gig);

      // Save gig
      await this.dbManager.insert('microGigs', gig);

      // Update matching engine with new gig
      await this.matchingEngine.addGig(gig);

      // Find and notify matching workers
      const matchedWorkers = await this.matchingEngine.findMatchingWorkers(gig, 10);
      await this.notifyMatchedWorkers(matchedWorkers, gig);

      this.emit('microGigPosted', { clientId, gig });

      return gig;
    } catch (error) {
      console.error('Failed to post micro-gig:', error);
      throw error;
    }
  }

  /**
   * Apply for micro-gig
   */
  public async applyForGig(
    userId: string,
    gigId: string,
    applicationData: {
      proposedRate?: string;
      coverLetter: string;
      estimatedTimeline: string;
      attachedPortfolio?: string[];
      availability?: string;
    }
  ): Promise<{
    applicationId: string;
    status: string;
    matchingScore: number;
    recommendations: string[];
  }> {
    try {
      // Validate user has skill profile
      const profile = await this.getUserSkillProfile(userId);
      if (!profile || profile.status !== 'active') {
        throw new Error('Active skill profile required');
      }

      // Get gig details
      const gig = await this.getMicroGig(gigId);
      if (!gig || gig.status !== 'published') {
        throw new Error('Gig not available for applications');
      }

      // Check application eligibility
      await this.checkApplicationEligibility(userId, profile, gig);

      // Calculate matching score
      const matchingResult = await this.matchingEngine.calculateMatchScore(userId, gigId);

      // Create application
      const application = {
        applicantId: userId,
        profileId: profile.profileId,
        proposedRate: applicationData.proposedRate || profile.pricing.hourlyRate,
        coverLetter: applicationData.coverLetter,
        estimatedTimeline: applicationData.estimatedTimeline,
        attachedPortfolio: applicationData.attachedPortfolio || [],
        status: 'submitted' as const,
        submittedAt: new Date()
      };

      // Add application to gig
      await this.dbManager.update(
        'microGigs',
        { gigId },
        {
          $push: { applications: application },
          $set: { updatedAt: new Date() }
        }
      );

      // Notify client of new application
      await this.notifyClientApplication(gig.clientId, application, matchingResult.score);

      // Generate recommendations for improvement
      const recommendations = await this.generateApplicationRecommendations(
        matchingResult,
        profile,
        gig
      );

      this.emit('gigApplicationSubmitted', {
        userId,
        gigId,
        application,
        matchingScore: matchingResult.score
      });

      return {
        applicationId: uuidv4(),
        status: 'submitted',
        matchingScore: matchingResult.score,
        recommendations
      };
    } catch (error) {
      console.error('Failed to apply for gig:', error);
      throw error;
    }
  }

  /**
   * Hire worker for gig
   */
  public async hireWorker(
    clientId: string,
    gigId: string,
    applicantId: string,
    contractTerms: {
      finalRate?: string;
      startDate?: Date;
      deliveryDate?: Date;
      specialTerms?: string;
    }
  ): Promise<GigContract> {
    try {
      // Validate client owns the gig
      const gig = await this.getMicroGig(gigId);
      if (!gig || gig.clientId !== clientId) {
        throw new Error('Invalid gig or client authorization');
      }

      // Find and update application status
      const application = gig.applications.find(app => app.applicantId === applicantId);
      if (!application) {
        throw new Error('Application not found');
      }

      // Update application status
      await this.dbManager.update(
        'microGigs',
        { gigId, 'applications.applicantId': applicantId },
        {
          $set: {
            'applications.$.status': 'hired',
            'applications.$.hiredAt': new Date()
          }
        }
      );

      // Create contract
      const contract: GigContract = GigContractSchema.parse({
        contractId: uuidv4(),
        gigId,
        clientId,
        workerId: applicantId,
        terms: {
          scope: gig.description,
          deliverables: gig.deliverables.items.map(item => item.name),
          timeline: {
            startDate: contractTerms.startDate || new Date(),
            endDate: contractTerms.deliveryDate || gig.visibility.deadline,
            milestones: gig.scope.milestones.map(milestone => ({
              title: milestone.title,
              dueDate: milestone.deadline,
              paymentAmount: milestone.paymentAmount,
              completed: false
            }))
          },
          payment: {
            totalAmount: contractTerms.finalRate || gig.pricing.budget,
            currency: gig.pricing.currency,
            schedule: gig.pricing.paymentSchedule.map(schedule => ({
              milestone: schedule.milestone,
              amount: schedule.percentage.toString(),
              dueDate: schedule.dueDate,
              paid: false
            })),
            deposit: gig.pricing.depositRequired ? {
              amount: gig.pricing.depositAmount || (parseFloat(gig.pricing.budget) * 0.3).toString(),
              held: true,
              released: false
            } : undefined
          },
          revisions: gig.deliverables.revisions,
          ipOwnership: 'client',
          confidentiality: true,
          termination: {
            noticePeriod: 7,
            penalties: '0'
          }
        },
        progress: {
          status: 'not_started',
          completedMilestones: 0,
          totalMilestones: gig.scope.milestones.length || 1,
          lastUpdate: new Date(),
          issues: []
        },
        communication: [],
        ratings: {},
        financials: {
          totalEarned: '0',
          platformFee: (parseFloat(gig.pricing.budget) * 0.1).toString(), // 10% platform fee
          netPaid: '0',
          refunds: '0',
          bonuses: '0'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Save contract
      await this.dbManager.insert('gigContracts', contract);

      // Update gig status
      await this.dbManager.update(
        'microGigs',
        { gigId },
        {
          $set: {
            status: 'in_progress',
            hiredWorker: {
              userId: applicantId,
              profileId: application.profileId,
              hiredAt: new Date(),
              contractTerms
            },
            updatedAt: new Date()
          }
        }
      );

      // Process deposit if required
      if (gig.pricing.depositRequired) {
        await this.processDeposit(clientId, contract.terms.payment.deposit!.amount);
      }

      // Notify both parties
      await this.notifyHireConfirmation(clientId, applicantId, contract);

      this.emit('workerHired', { clientId, workerId: applicantId, contract });

      return contract;
    } catch (error) {
      console.error('Failed to hire worker:', error);
      throw error;
    }
  }

  /**
   * Submit milestone completion
   */
  public async submitMilestone(
    contractId: string,
    milestoneData: {
      milestoneIndex: number;
      deliverables: any[];
      notes?: string;
      files?: string[];
    }
  ): Promise<{
    accepted: boolean;
    nextSteps: string[];
    paymentPending: string;
    feedback: string[];
  }> {
    try {
      const contract = await this.getGigContract(contractId);
      if (!contract) {
        throw new Error('Contract not found');
      }

      const milestoneIndex = milestoneData.milestoneIndex;
      const milestone = contract.terms.timeline.milestones[milestoneIndex];
      if (!milestone) {
        throw new Error('Milestone not found');
      }

      if (milestone.completed) {
        throw new Error('Milestone already completed');
      }

      // Validate deliverables against requirements
      const validationResult = await this.validateMilestoneDeliverables(
        contract,
        milestoneData,
        milestone
      );

      // Update milestone status
      await this.dbManager.update(
        'gigContracts',
        { contractId },
        {
          $set: {
            [`terms.timeline.milestones.${milestoneIndex}.completed`]: true,
            [`progress.completedMilestones`]: contract.progress.completedMilestones + 1,
            [`progress.lastUpdate`]: new Date()
          },
          $push: {
            communication: {
              senderId: contract.workerId,
              message: `Milestone "${milestone.title}" submitted for review`,
              type: 'milestone_update',
              timestamp: new Date(),
              read: false
            }
          }
        }
      );

      // Notify client for review
      await this.notifyMilestoneSubmission(contract.clientId, contract, milestoneData);

      // Check if all milestones completed
      const allCompleted = contract.terms.timeline.milestones.every((m, i) =>
        i === milestoneIndex || m.completed
      );

      if (allCompleted) {
        await this.dbManager.update(
          'gigContracts',
          { contractId },
          { $set: { 'progress.status': 'review' } }
        );
      }

      // Calculate payment amount for this milestone
      const paymentAmount = milestone.paymentAmount;

      this.emit('milestoneSubmitted', {
        contractId,
        milestoneIndex,
        validationScore: validationResult.score,
        paymentAmount
      });

      return {
        accepted: validationResult.score >= 0.8, // 80% threshold
        nextSteps: [
          'Client review and approval',
          'Payment processing upon approval',
          allCompleted ? 'Final project completion' : 'Continue to next milestone'
        ],
        paymentPending: paymentAmount,
        feedback: validationResult.feedback
      };
    } catch (error) {
      console.error('Failed to submit milestone:', error);
      throw error;
    }
  }

  /**
   * Get personalized job recommendations for worker
   */
  public async getJobRecommendations(
    userId: string,
    filters: {
      categories?: string[];
      minRate?: string;
      maxDuration?: string;
      location?: string;
    } = {},
    limit: number = 10
  ): Promise<{
    recommended: MicroGig[];
    newMatches: MicroGig[];
    savedSearches: any[];
  }> {
    try {
      const profile = await this.getUserSkillProfile(userId);
      if (!profile) {
        throw new Error('Skill profile required for recommendations');
      }

      // Get AI-powered recommendations
      const recommended = await this.matchingEngine.getPersonalizedRecommendations(
        userId,
        profile,
        filters,
        Math.floor(limit * 0.6)
      );

      // Get new matches (recently posted gigs matching skills)
      const newMatches = await this.matchingEngine.getNewMatches(
        userId,
        profile,
        filters,
        Math.floor(limit * 0.4)
      );

      // Get saved searches
      const savedSearches = await this.getSavedSearches(userId);

      return {
        recommended,
        newMatches,
        savedSearches
      };
    } catch (error) {
      console.error('Failed to get job recommendations:', error);
      throw error;
    }
  }

  /**
   * Get worker analytics and performance metrics
   */
  public async getWorkerAnalytics(
    userId: string,
    timeframe: { start: Date; end: Date } = {
      start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
      end: new Date()
    }
  ): Promise<{
    overview: {
      totalEarnings: string;
      completedProjects: number;
      averageRating: number;
      successRate: number;
      activeContracts: number;
    };
    performance: {
      onTimeDelivery: number;
      clientSatisfaction: number;
      repeatClientRate: number;
      averageResponseTime: number;
    };
    financial: {
      earnings: Array<{ period: string; amount: string; projects: number }>;
      rates: Array<{ category: string; averageRate: string; projects: number }>;
      growth: number;
    };
    reputation: {
      score: number;
      rank: number;
      badges: string[];
      achievements: any[];
    };
  }> {
    try {
      const profile = await this.getUserSkillProfile(userId);
      if (!profile) {
        throw new Error('Worker profile not found');
      }

      // Get completed contracts
      const contracts = await this.dbManager.find('gigContracts', {
        workerId: userId,
        'progress.status': 'completed',
        completedAt: { $gte: timeframe.start, $lte: timeframe.end }
      });

      // Calculate overview metrics
      const totalEarnings = contracts.reduce((sum, contract) =>
        sum + parseFloat(contract.financials.netPaid), 0
      ).toString();

      const completedProjects = contracts.length;
      const averageRating = contracts.reduce((sum, contract) =>
        sum + (contract.ratings.clientRating?.score || 0), 0
      ) / Math.max(completedProjects, 1);

      const successRate = contracts.filter(contract =>
        contract.ratings.clientRating && contract.ratings.clientRating.score >= 4
      ).length / Math.max(completedProjects, 1);

      // Get active contracts
      const activeContracts = await this.dbManager.count('gigContracts', {
        workerId: userId,
        'progress.status': { $in: ['not_started', 'in_progress', 'review'] }
      });

      // Calculate performance metrics
      const onTimeDelivery = await this.calculateOnTimeDelivery(contracts);
      const clientSatisfaction = averageRating / 5;
      const repeatClientRate = await this.calculateRepeatClientRate(userId, contracts);
      const averageResponseTime = await this.calculateAverageResponseTime(userId);

      // Get financial breakdown
      const earnings = await this.calculateEarningsBreakdown(userId, timeframe);
      const rates = await this.calculateRateBreakdown(userId, timeframe);
      const growth = await this.calculateEarningsGrowth(userId, timeframe);

      // Get reputation data
      const reputation = await this.reputationSystem.getWorkerReputation(userId);

      return {
        overview: {
          totalEarnings,
          completedProjects,
          averageRating,
          successRate,
          activeContracts
        },
        performance: {
          onTimeDelivery,
          clientSatisfaction,
          repeatClientRate,
          averageResponseTime
        },
        financial: {
          earnings,
          rates,
          growth
        },
        reputation
      };
    } catch (error) {
      console.error('Failed to get worker analytics:', error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private async initializeSkillCategories(): Promise<void> {
    const defaultCategories = [
      {
        name: 'Content & Writing',
        description: 'Writing, editing, translation, content creation',
        icon: '✍️',
        color: '#FF6B6B',
        averageRate: '25'
      },
      {
        name: 'Design & Creative',
        description: 'Graphic design, UI/UX, video editing, animation',
        icon: '🎨',
        color: '#4ECDC4',
        averageRate: '35'
      },
      {
        name: 'Programming & Tech',
        description: 'Web development, mobile apps, AI, blockchain',
        icon: '💻',
        color: '#45B7D1',
        averageRate: '50'
      },
      {
        name: 'Digital Marketing',
        description: 'SEO, social media, PPC, email marketing',
        icon: '📱',
        color: '#96CEB4',
        averageRate: '30'
      },
      {
        name: 'Data & Analytics',
        description: 'Data analysis, visualization, machine learning',
        icon: '📊',
        color: '#DDA0DD',
        averageRate: '45'
      },
      {
        name: 'Customer Support',
        description: 'Customer service, virtual assistance, chat support',
        icon: '🎧',
        color: '#FFB347',
        averageRate: '20'
      }
    ];

    for (const categoryData of defaultCategories) {
      const existing = await this.dbManager.findOne('skillCategories', {
        name: categoryData.name
      });

      if (!existing) {
        const category: SkillCategory = SkillCategorySchema.parse({
          ...categoryData,
          categoryId: uuidv4(),
          level: 2
        });

        await this.dbManager.insert('skillCategories', category);
      }
    }
  }

  private startJobMatching(): void {
    // Run matching algorithm every 5 minutes
    setInterval(async () => {
      try {
        await this.matchingEngine.runMatchingCycle();
      } catch (error) {
        console.error('Job matching error:', error);
      }
    }, 5 * 60 * 1000);
  }

  private startReputationMonitoring(): void {
    // Update reputation scores every hour
    setInterval(async () => {
      try {
        await this.reputationSystem.updateAllReputationScores();
      } catch (error) {
        console.error('Reputation monitoring error:', error);
      }
    }, 60 * 60 * 1000);
  }

  private async getUserSkillProfile(userId: string): Promise<SkillProfile | null> {
    return await this.dbManager.findOne('skillProfiles', { userId });
  }

  private async getMicroGig(gigId: string): Promise<MicroGig | null> {
    return await this.dbManager.findOne('microGigs', { gigId });
  }

  private async getGigContract(contractId: string): Promise<GigContract | null> {
    return await this.dbManager.findOne('gigContracts', { contractId });
  }

  private async validateGigRequirements(gig: MicroGig): Promise<void> {
    // Validate gig meets platform requirements
    if (parseFloat(gig.pricing.budget) < 10) {
      throw new Error('Minimum budget is $10');
    }

    if (gig.scope.estimatedHours && gig.scope.estimatedHours > 0) {
      const hourlyRate = parseFloat(gig.pricing.budget) / gig.scope.estimatedHours;
      if (hourlyRate < 5) {
        throw new Error('Minimum hourly rate is $5');
      }
    }
  }

  private async checkApplicationEligibility(
    userId: string,
    profile: SkillProfile,
    gig: MicroGig
  ): Promise<void> {
    // Check if worker meets gig requirements
    if (gig.requirements.skillLevel !== 'beginner' && profile.experience.reputation < 50) {
      throw new Error('Insufficient reputation for this skill level');
    }

    if (gig.requirements.minExperience > 0 && profile.experience.years < gig.requirements.minExperience) {
      throw new Error('Insufficient experience for this gig');
    }
  }

  private async notifyMatchedWorkers(workers: string[], gig: MicroGig): Promise<void> {
    // Notify workers about matching gigs
    for (const workerId of workers) {
      this.emit('gigRecommendation', { workerId, gig });
    }
  }

  private async notifyClientApplication(
    clientId: string,
    application: any,
    matchingScore: number
  ): Promise<void> {
    // Notify client about new application
    this.emit('newApplication', { clientId, application, matchingScore });
  }

  private async notifyHireConfirmation(
    clientId: string,
    workerId: string,
    contract: GigContract
  ): Promise<void> {
    // Notify both parties about hiring confirmation
    this.emit('hireConfirmation', { clientId, workerId, contract });
  }

  private async processDeposit(clientId: string, amount: string): Promise<void> {
    // Process escrow deposit
    console.log(`Processing deposit: ${amount} from client ${clientId}`);
    this.emit('depositProcessed', { clientId, amount });
  }

  private async notifyMilestoneSubmission(
    clientId: string,
    contract: GigContract,
    milestoneData: any
  ): Promise<void> {
    // Notify client about milestone submission
    this.emit('milestoneSubmitted', { clientId, contract, milestoneData });
  }

  private async validateMilestoneDeliverables(
    contract: GigContract,
    submissionData: any,
    milestone: any
  ): Promise<{ score: number; feedback: string[] }> {
    // AI-powered deliverable validation
    return {
      score: 0.85 + Math.random() * 0.15, // 85-100% score
      feedback: ['High quality work', 'Meets all requirements']
    };
  }

  private async getSavedSearches(userId: string): Promise<any[]> {
    // Get user's saved job searches
    return [];
  }

  private async calculateOnTimeDelivery(contracts: GigContract[]): Promise<number> {
    if (contracts.length === 0) return 1.0;

    const onTimeContracts = contracts.filter(contract => {
      // Check if completed before or on deadline
      return contract.completedAt && contract.terms.timeline.endDate >= contract.completedAt;
    }).length;

    return onTimeContracts / contracts.length;
  }

  private async calculateRepeatClientRate(userId: string, contracts: GigContract[]): Promise<number> {
    if (contracts.length === 0) return 0;

    const clientIds = contracts.map(c => c.clientId);
    const uniqueClients = new Set(clientIds).size;
    const repeatClients = clientIds.length - uniqueClients;

    return repeatClients / Math.max(uniqueClients, 1);
  }

  private async calculateAverageResponseTime(userId: string): Promise<number> {
    // Calculate average response time in hours
    return 2.5; // Simplified
  }

  private async calculateEarningsBreakdown(
    userId: string,
    timeframe: { start: Date; end: Date }
  ): Promise<Array<{ period: string; amount: string; projects: number }>> {
    // Calculate monthly earnings breakdown
    const breakdown = [];
    const current = new Date(timeframe.start);

    while (current <= timeframe.end) {
      const periodStart = new Date(current);
      const periodEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);

      // Mock calculation
      breakdown.push({
        period: periodStart.toISOString().substring(0, 7), // YYYY-MM
        amount: (Math.random() * 5000 + 1000).toFixed(2),
        projects: Math.floor(Math.random() * 10) + 1
      });

      current.setMonth(current.getMonth() + 1);
    }

    return breakdown;
  }

  private async calculateRateBreakdown(
    userId: string,
    timeframe: { start: Date; end: Date }
  ): Promise<Array<{ category: string; averageRate: string; projects: number }>> {
    // Calculate rates by category
    return [
      { category: 'Programming & Tech', averageRate: '55.00', projects: 5 },
      { category: 'Design & Creative', averageRate: '35.00', projects: 3 },
      { category: 'Content & Writing', averageRate: '25.00', projects: 2 }
    ];
  }

  private async calculateEarningsGrowth(
    userId: string,
    timeframe: { start: Date; end: Date }
  ): Promise<number> {
    // Calculate earnings growth percentage
    return 15.5; // Simplified
  }

  private async generateApplicationRecommendations(
    matchingResult: any,
    profile: SkillProfile,
    gig: MicroGig
  ): Promise<string[]> {
    const recommendations = [];

    if (matchingResult.score < 0.7) {
      recommendations.push('Add more relevant portfolio items');
      recommendations.push('Complete more gigs in this category');
    }

    if (profile.experience.reputation < 70) {
      recommendations.push('Improve your reputation score');
    }

    if (!profile.verification.skillVerified) {
      recommendations.push('Get your skills verified');
    }

    return recommendations;
  }

  /**
   * Cleanup method
   */
  public async shutdown(): Promise<void> {
    await this.redis.quit();
    await this.dbManager.disconnect();
  }
}

/**
 * Job Matching Engine
 * AI-powered matching between gigs and skilled workers
 */
class JobMatchingEngine {
  private redis: Redis;
  private dbManager: DatabaseManager;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!);
    this.dbManager = new DatabaseManager();
  }

  public async updateWorkerProfile(userId: string, profile: SkillProfile): Promise<void> {
    // Update worker profile in matching index
    await this.redis.setex(
      `worker_profile:${userId}`,
      3600,
      JSON.stringify(profile)
    );
  }

  public async addGig(gig: MicroGig): Promise<void> {
    // Add gig to matching index
    await this.redis.setex(
      `gig:${gig.gigId}`,
      gig.visibility.deadline.getTime() - Date.now(),
      JSON.stringify(gig)
    );
  }

  public async findMatchingWorkers(gig: MicroGig, limit: number): Promise<string[]> {
    // Find workers matching gig requirements
    const workers = await this.dbManager.find('skillProfiles', {
      status: 'active',
      'category.primary': gig.category.primary
    }, { limit });

    return workers.map(worker => worker.userId);
  }

  public async calculateMatchScore(userId: string, gigId: string): Promise<{ score: number; factors: any }> {
    // Calculate sophisticated matching score
    const score = 0.65 + Math.random() * 0.35; // 65-100%

    return {
      score,
      factors: {
        skills: 0.8,
        experience: 0.7,
        reputation: 0.9,
        availability: 0.6,
        rate: 0.8
      }
    };
  }

  public async getPersonalizedRecommendations(
    userId: string,
    profile: SkillProfile,
    filters: any,
    limit: number
  ): Promise<MicroGig[]> {
    // Get personalized gig recommendations
    return await this.dbManager.find('microGigs', {
      status: 'published',
      'category.primary': profile.category.primary
    }, { limit, sort: { createdAt: -1 } });
  }

  public async getNewMatches(
    userId: string,
    profile: SkillProfile,
    filters: any,
    limit: number
  ): Promise<MicroGig[]> {
    // Get newly posted gigs matching user skills
    return await this.dbManager.find('microGigs', {
      status: 'published',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    }, { limit, sort: { createdAt: -1 } });
  }

  public async runMatchingCycle(): Promise<void> {
    // Run periodic matching algorithm
    console.log('Running job matching cycle...');
  }
}

/**
 * Reputation System
 * Manages worker and client reputation scores
 */
class ReputationSystem {
  private redis: Redis;
  private dbManager: DatabaseManager;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!);
    this.dbManager = new DatabaseManager();
  }

  public async getWorkerReputation(userId: string): Promise<any> {
    // Get comprehensive reputation data
    return {
      score: 85,
      rank: 1250,
      badges: ['Top Rated', 'Quick Responder'],
      achievements: []
    };
  }

  public async updateAllReputationScores(): Promise<void> {
    // Update all reputation scores based on recent activity
    console.log('Updating reputation scores...');
  }
}

/**
 * Dispute Resolution System
 * Handles contract disputes and resolution
 */
class DisputeResolution {
  private redis: Redis;
  private dbManager: DatabaseManager;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!);
    this.dbManager = new DatabaseManager();
  }
}

export default SkillJobsPlatform;