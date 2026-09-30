<?php

namespace App\Actions\Databases;

use App\Models\Attachment;
use App\Models\DatabaseProperty;
use App\Models\DatabaseValue;
use App\Models\DatabaseViewSetting;
use App\Models\Node;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ManageDatabase
{
    public const TYPES = ['text', 'number', 'select', 'multi_select', 'checkbox', 'date', 'url', 'email', 'files', 'mention'];

    public function createProperty(Node $database, array $data): DatabaseProperty
    {
        $this->assertConfig($data['type'], $data['config'] ?? []);

        return DB::transaction(function () use ($database, $data): DatabaseProperty {
            $this->lockDatabase($database);
            $property = DatabaseProperty::query()->create([
                'database_node_id' => $database->id,
                'name' => trim($data['name']),
                'type' => $data['type'],
                'position' => DatabaseProperty::query()->where('database_node_id', $database->id)->count(),
                'config' => $data['config'] ?? [],
            ]);
            if (array_key_exists('default', $property->config)) {
                $value = $this->validateValue($database, $property, $property->config['default']);
                foreach ($database->children()->where('type', 'document')->pluck('id') as $documentId) {
                    DatabaseValue::query()->create(['document_node_id' => $documentId, 'property_id' => $property->id, 'value' => $value]);
                }
            }

            return $property;
        });
    }

    public function updateProperty(Node $database, DatabaseProperty $property, array $data): void
    {
        DB::transaction(function () use ($database, $property, $data): void {
            $this->lockDatabase($database);
            $property->refresh();
            $newType = $data['type'] ?? $property->type;
            $newConfig = $data['config'] ?? $property->config;
            $this->assertConfig($newType, $newConfig);
            if ($newType !== $property->type && DatabaseValue::query()->where('property_id', $property->id)->exists()) {
                throw ValidationException::withMessages(['type' => 'Clear this property’s values before changing its type.']);
            }
            if (in_array($newType, ['select', 'multi_select'], true)) {
                $allowedOptions = $newConfig['options'] ?? [];
                foreach (DatabaseValue::query()->where('property_id', $property->id)->cursor() as $storedValue) {
                    $selectedOptions = is_array($storedValue->value) ? $storedValue->value : [$storedValue->value];
                    if (array_diff($selectedOptions, $allowedOptions) !== []) {
                        throw ValidationException::withMessages(['config' => 'Existing values use an option you removed. Clear those values first.']);
                    }
                }
            }
            $property->update([
                'name' => trim($data['name'] ?? $property->name),
                'type' => $newType,
                'config' => $newConfig,
            ]);
        });
    }

    public function reorderProperty(Node $database, DatabaseProperty $property, int $position): void
    {
        DB::transaction(function () use ($database, $property, $position): void {
            $this->lockDatabase($database);
            $properties = DatabaseProperty::query()->where('database_node_id', $database->id)
                ->whereKeyNot($property->id)->orderBy('position')->orderBy('id')->get()->all();
            array_splice($properties, min($position, count($properties)), 0, [$property]);
            foreach ($properties as $index => $item) {
                $item->update(['position' => $index]);
            }
        });
    }

    public function writeValue(Node $database, Node $document, DatabaseProperty $property, mixed $value): void
    {
        DB::transaction(function () use ($database, $document, $property, $value): void {
            $this->lockDatabase($database);
            $document->refresh();
            if ($document->type !== 'document' || $document->parent_id !== $database->id || $property->database_node_id !== $database->id) {
                throw ValidationException::withMessages(['value' => 'This document and property must belong to the same database.']);
            }
            if ($value === null || $value === '') {
                DatabaseValue::query()->where('document_node_id', $document->id)->where('property_id', $property->id)->delete();

                return;
            }
            $validated = $this->validateValue($database, $property, $value);
            if ($property->type === 'files') {
                $ownedCount = Attachment::query()->where('workspace_id', $database->workspace_id)
                    ->where('owner_node_id', $document->id)->whereIn('id', $validated)->count();
                if ($ownedCount !== count($validated)) {
                    throw ValidationException::withMessages(['value' => 'Files must be uploaded to this document.']);
                }
            }
            DatabaseValue::query()->updateOrCreate(
                ['document_node_id' => $document->id, 'property_id' => $property->id],
                ['value' => $validated],
            );
        });
    }

    public function initializeDocument(Node $database, Node $document): void
    {
        foreach (DatabaseProperty::query()->where('database_node_id', $database->id)->get() as $property) {
            if (array_key_exists('default', $property->config)) {
                $this->writeValue($database, $document, $property, $property->config['default']);
            }
        }
    }

    public function saveView(Node $database, string $view, array $config): void
    {
        foreach ($config['visible_property_ids'] ?? [] as $id) {
            $this->property($database, (int) $id);
        }
        foreach ($config['filters'] ?? [] as $filter) {
            $this->property($database, (int) $filter['property_id']);
        }
        foreach ($config['sorts'] ?? [] as $sort) {
            if ($sort['field'] !== 'title') {
                $this->property($database, (int) $sort['field']);
            }
        }
        DatabaseViewSetting::query()->updateOrCreate(
            ['database_node_id' => $database->id, 'view_type' => $view],
            ['config' => $config],
        );
    }

    public function property(Node $database, int $id): DatabaseProperty
    {
        return DatabaseProperty::query()->where('database_node_id', $database->id)->findOrFail($id);
    }

    private function validateValue(Node $database, DatabaseProperty $property, mixed $value): mixed
    {
        $invalid = fn () => throw ValidationException::withMessages(['value' => 'Value does not match the property type or options.']);
        $options = $property->config['options'] ?? [];
        switch ($property->type) {
            case 'text':
                if (! is_string($value) || mb_strlen($value) > 10000) {
                    $invalid();
                }
                break;
            case 'number':
                if (! is_int($value) && ! is_float($value)) {
                    $invalid();
                }
                break;
            case 'select':
                if (! is_string($value) || ! in_array($value, $options, true)) {
                    $invalid();
                }
                break;
            case 'multi_select':
                if (! is_array($value) || ! array_is_list($value)) {
                    $invalid();
                }
                foreach ($value as $selected) {
                    if (! is_string($selected)) {
                        $invalid();
                    }
                }
                if (count($value) !== count(array_unique($value)) || count(array_diff($value, $options)) > 0) {
                    $invalid();
                }
                break;
            case 'checkbox':
                if (! is_bool($value)) {
                    $invalid();
                }
                break;
            case 'date':
                if (! is_string($value) || ! preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) || date('Y-m-d', strtotime($value)) !== $value) {
                    $invalid();
                }
                break;
            case 'url':
                if (! is_string($value) || mb_strlen($value) > 2048 || ! filter_var($value, FILTER_VALIDATE_URL) || ! in_array(parse_url($value, PHP_URL_SCHEME), ['http', 'https'], true)) {
                    $invalid();
                }
                break;
            case 'email':
                if (! is_string($value) || mb_strlen($value) > 255 || ! filter_var($value, FILTER_VALIDATE_EMAIL)) {
                    $invalid();
                }
                break;
            case 'files':
            case 'mention':
                if (! is_array($value) || ! array_is_list($value) || count($value) > 50) {
                    $invalid();
                }
                foreach ($value as $id) {
                    if (! is_int($id)) {
                        $invalid();
                    }
                    $valid = $property->type === 'files'
                        ? Attachment::query()->where('workspace_id', $database->workspace_id)->whereKey($id)->exists()
                        : Node::query()->where('workspace_id', $database->workspace_id)->whereKey($id)->exists();
                    if (! $valid) {
                        $invalid();
                    }
                }
                if (count($value) !== count(array_unique($value))) {
                    $invalid();
                }
                break;
            default:
                $invalid();
        }

        return $value;
    }

    private function assertConfig(string $type, array $config): void
    {
        if (! in_array($type, self::TYPES, true)) {
            throw ValidationException::withMessages(['type' => 'Unknown property type.']);
        }
        if (array_key_exists('default', $config) && in_array($type, ['files', 'mention'], true)) {
            throw ValidationException::withMessages(['config' => 'File and mention properties cannot have a default.']);
        }
        if (in_array($type, ['select', 'multi_select'], true)) {
            $options = $config['options'] ?? [];
            if (! is_array($options) || ! array_is_list($options) || count($options) > 100) {
                throw ValidationException::withMessages(['config' => 'Options must be a list of up to 100 values.']);
            }
            foreach ($options as $option) {
                if (! is_string($option) || trim($option) === '' || mb_strlen($option) > 100) {
                    throw ValidationException::withMessages(['config' => 'Each option needs a name under 100 characters.']);
                }
            }
            if (count($options) !== count(array_unique($options))) {
                throw ValidationException::withMessages(['config' => 'Options must be unique.']);
            }
        }
    }

    private function lockDatabase(Node $database): void
    {
        Node::query()->whereKey($database->id)->lockForUpdate()->firstOrFail();
    }
}
