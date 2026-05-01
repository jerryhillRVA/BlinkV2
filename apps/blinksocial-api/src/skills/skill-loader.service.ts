import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  type: string;
  sections?: SkillSection[];
  systemPrompt: string;
  templates: Record<string, string>;
  /**
   * Mustache-style prompt fragments referenced by `prompts:` in the skill
   * frontmatter. Loaded the same way as `templates` but kept SEPARATE so
   * the skill-runner does not auto-append them to every system prompt.
   * Callers (e.g. `BlueprintPromptService`) read template strings from
   * here, hydrate placeholders, and pass the rendered text as a user-turn
   * content block — keeping mode-specific prompt construction out of
   * `OnboardingService` and inside the skill where it belongs (#94, AC-D).
   */
  prompts: Record<string, string>;
}

export interface SkillSection {
  id: string;
  name: string;
  minQuestions: number;
  maxQuestions: number;
}

interface SkillFrontmatter {
  id: string;
  name: string;
  description: string;
  type?: string;
  sections?: SkillSection[];
  templates?: string[];
  prompts?: string[];
  output_schema?: string;
}

@Injectable()
export class SkillLoaderService {
  private readonly logger = new Logger(SkillLoaderService.name);
  private readonly skillsBasePath: string;
  private readonly cache = new Map<string, SkillDefinition>();

  constructor() {
    // Try multiple resolution strategies since __dirname varies between
    // webpack bundles and ts-node/direct execution
    const candidates = [
      // Webpack build: dist/skills/definitions (relative to dist/main.js)
      path.join(__dirname, 'skills', 'definitions'),
      // Webpack build: __dirname may be the project root
      path.join(__dirname, '..', 'dist', 'skills', 'definitions'),
      // Development: source directory
      path.join(__dirname, '..', '..', 'src', 'skills', 'definitions'),
      // Absolute fallback from process.cwd
      path.join(
        process.cwd(),
        'apps',
        'blinksocial-api',
        'dist',
        'skills',
        'definitions',
      ),
      // Source fallback from process.cwd
      path.join(
        process.cwd(),
        'apps',
        'blinksocial-api',
        'src',
        'skills',
        'definitions',
      ),
    ];

    this.skillsBasePath = candidates.find((p) => fs.existsSync(p)) ?? candidates[0];
    this.logger.log(`Skills base path: ${this.skillsBasePath}`);
  }

  loadSkill(skillId: string): SkillDefinition {
    const cached = this.cache.get(skillId);
    if (cached) return cached;

    const skillDir = path.join(this.skillsBasePath, skillId);
    const skillMdPath = path.join(skillDir, 'skill.md');

    if (!fs.existsSync(skillMdPath)) {
      throw new Error(`Skill not found: ${skillId} (looked at ${skillMdPath})`);
    }

    const rawContent = fs.readFileSync(skillMdPath, 'utf-8');
    const { frontmatter, body } = this.parseFrontmatter(rawContent);

    const templates: Record<string, string> = {};
    if (frontmatter.templates) {
      for (const templateRef of frontmatter.templates) {
        const templatePath = path.join(skillDir, templateRef);
        if (fs.existsSync(templatePath)) {
          const templateName = path.basename(templateRef, path.extname(templateRef));
          templates[templateName] = fs.readFileSync(templatePath, 'utf-8');
        } else {
          this.logger.warn(`Template not found: ${templatePath}`);
        }
      }
    }

    if (frontmatter.output_schema) {
      const schemaPath = path.join(skillDir, frontmatter.output_schema);
      if (fs.existsSync(schemaPath)) {
        templates['output_schema'] = fs.readFileSync(schemaPath, 'utf-8');
      }
    }

    // Prompt fragments — stored separately so they DO NOT auto-append to
    // the system prompt. Hydrated and used as user-turn text by per-skill
    // services (see `BlueprintPromptService`).
    const prompts: Record<string, string> = {};
    if (frontmatter.prompts) {
      for (const promptRef of frontmatter.prompts) {
        const promptPath = path.join(skillDir, promptRef);
        if (fs.existsSync(promptPath)) {
          const promptName = path.basename(promptRef, path.extname(promptRef));
          prompts[promptName] = fs.readFileSync(promptPath, 'utf-8');
        } else {
          this.logger.warn(`Prompt template not found: ${promptPath}`);
        }
      }
    }

    const skill: SkillDefinition = {
      id: frontmatter.id,
      name: frontmatter.name,
      description: frontmatter.description,
      type: frontmatter.type || 'single-turn',
      sections: frontmatter.sections,
      systemPrompt: body.trim(),
      templates,
      prompts,
    };

    this.cache.set(skillId, skill);
    return skill;
  }

  private parseFrontmatter(content: string): {
    frontmatter: SkillFrontmatter;
    body: string;
  } {
    const fmRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = content.match(fmRegex);

    if (!match) {
      throw new Error('Invalid skill.md — missing YAML frontmatter');
    }

    const frontmatter = yaml.load(match[1]) as SkillFrontmatter;
    const body = match[2];

    return { frontmatter, body };
  }

  clearCache(): void {
    this.cache.clear();
  }
}
