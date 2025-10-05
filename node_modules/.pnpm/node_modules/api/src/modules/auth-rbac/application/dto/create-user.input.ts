import { plainToInstance } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  ValidationError,
  validate,
} from 'class-validator';

class CreateUserPayloadSchema {
  @IsString({ message: 'El nombre es obligatorio.' })
  @Length(1, 120, {
    message: 'El nombre debe tener entre 1 y 120 caracteres.',
  })
  name!: string;

  @IsEmail({}, { message: 'El correo electrónico no es válido.' })
  email!: string;

  @IsString({ message: 'La contraseña es obligatoria.' })
  @Length(8, 120, {
    message: 'La contraseña debe tener entre 8 y 120 caracteres.',
  })
  password!: string;

  @IsOptional()
  @IsArray({ message: 'Los roles deben ser un arreglo.' })
  @ArrayUnique({ message: 'Los roles no pueden repetirse.' })
  @IsUUID('4', {
    each: true,
    message: 'Cada rol debe ser un identificador válido.',
  })
  roles?: string[];
}

function extractValidationMessage(errors: ValidationError[]): string {
  for (const error of errors) {
    if (error.constraints) {
      const firstKey = Object.keys(error.constraints)[0];
      if (firstKey) {
        return error.constraints[firstKey];
      }
    }
    if (error.children && error.children.length > 0) {
      const nestedMessage = extractValidationMessage(error.children);
      if (nestedMessage) {
        return nestedMessage;
      }
    }
  }
  return 'Payload inválido.';
}

export class CreateUserInput {
  private constructor(
    public readonly name: string,
    public readonly email: string,
    public readonly password: string,
    public readonly roles: string[],
  ) {}

  static async create(payload: {
    name: string;
    email: string;
    password: string;
    roles?: string[];
  }): Promise<CreateUserInput> {
    const schema = plainToInstance(CreateUserPayloadSchema, payload);
    const errors = await validate(schema, {
      whitelist: true,
      forbidUnknownValues: true,
    });
    if (errors.length > 0) {
      throw new Error(extractValidationMessage(errors));
    }
    return new CreateUserInput(
      schema.name,
      schema.email,
      schema.password,
      schema.roles ?? [],
    );
  }
}
