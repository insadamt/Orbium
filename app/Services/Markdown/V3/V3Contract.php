<?php

/**
 * Summary: Shares V3 identity/type/version rules with CodeMirror and rejects ambiguous structural JSON; depends on the shared JSON contract and existing Orbium metadata validation.
 */

namespace App\Services\Markdown\V3;

use App\Services\Markdown\OrbiumMetadata;
use InvalidArgumentException;
use JsonException;

final class V3Contract
{
    /** @return array<string, mixed> */
    public static function definition(): array
    {
        static $definition;

        return $definition ??= json_decode(file_get_contents(resource_path('js/lib/editor-v3-contract.json')), true, 32, JSON_THROW_ON_ERROR);
    }

    public static function validIdentity(mixed $identity): bool
    {
        return is_string($identity) && preg_match('~'.self::definition()['idPattern'].'~D', $identity) === 1;
    }

    /** @return array{id: string, type: string} */
    public function decodeHeader(string $line): array
    {
        if (! preg_match('/^\+\+block (\{.*\})\+\+[ \t]*$/D', $line, $match)) {
            throw new InvalidArgumentException('Expected ++block {"id":"…","type":"…"}++ on one line.');
        }
        $metadata = $this->decodeObject($match[1]);
        $this->requireKeys($metadata, ['id', 'type']);
        if (! self::validIdentity($metadata['id'])) {
            throw new InvalidArgumentException('Block IDs require 1–128 ASCII letters, digits, underscores or hyphens, starting with a letter or digit.');
        }
        if (! is_string($metadata['type']) || ! array_key_exists($metadata['type'], self::definition()['blockTypes'])) {
            throw new InvalidArgumentException('Unknown V3 block type.');
        }

        return $metadata;
    }

    /** @return array<string, mixed> */
    public function decodeDirective(string $json): array
    {
        $metadata = $this->decodeObject($json);
        if (($metadata['kind'] ?? null) === 'column') {
            $this->requireKeys($metadata, ['kind', 'id']);
            if (! self::validIdentity($metadata['id'])) {
                throw new InvalidArgumentException('A column needs a valid persistent ID.');
            }
        } else {
            //
            // JSON numbers have one numeric domain in JavaScript; integer-valued spellings such as 1.0 must validate identically here.
            //
            try {
                app(OrbiumMetadata::class)->decode($this->encodeMetadataForValidation($json));
            } catch (JsonException) {
                throw new InvalidArgumentException('Invalid numeric metadata.');
            }
        }

        return $metadata;
    }

    private function encodeMetadataForValidation(string $json): string
    {
        $object = json_decode($json, false, self::definition()['limits']['depth'] + 2, JSON_THROW_ON_ERROR);

        return json_encode($object, JSON_THROW_ON_ERROR);
    }

    /** @return array<string, mixed> */
    public function decodeObject(string $json): array
    {
        try {
            $object = json_decode($json, false, self::definition()['limits']['depth'] + 2, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            throw new InvalidArgumentException('Structural metadata contains invalid JSON, Unicode or nesting.');
        }
        if (! $object instanceof \stdClass) {
            throw new InvalidArgumentException('Structural metadata must be a JSON object.');
        }
        $keys = [];
        $depth = 0;
        for ($index = 0, $length = strlen($json); $index < $length; $index++) {
            $character = $json[$index];
            if ($character === '{' || $character === '[') {
                if (++$depth > self::definition()['limits']['depth']) {
                    throw new InvalidArgumentException('Metadata is nested too deeply.');
                }
            } elseif ($character === '}' || $character === ']') {
                $depth--;
            } elseif ($character === '"') {
                $start = $index++;
                while ($index < $length && $json[$index] !== '"') {
                    if ($json[$index] === '\\') {
                        $index++;
                    }
                    $index++;
                }
                if ($depth === 1 && preg_match('/^[ \t]*:/', substr($json, $index + 1))) {
                    $key = json_decode(substr($json, $start, $index - $start + 1), true, 2, JSON_THROW_ON_ERROR);
                    if (isset($keys[$key])) {
                        throw new InvalidArgumentException('Duplicate metadata keys are not allowed.');
                    }
                    $keys[$key] = true;
                }
            }
        }

        return json_decode($json, true, self::definition()['limits']['depth'] + 2, JSON_THROW_ON_ERROR);
    }

    /** @param array<string, mixed> $metadata
     * @param  list<string>  $keys
     */
    public function requireKeys(array $metadata, array $keys): void
    {
        if (count($metadata) !== count($keys) || array_diff($keys, array_keys($metadata)) !== []) {
            throw new InvalidArgumentException('Expected exactly these metadata keys: '.implode(', ', $keys).'.');
        }
    }
}
