<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Activity extends Model
{
    protected $fillable = ['baby_id', 'type', 'notes', 'activity_time'];

    public function baby()
    {
        return $this->belongsTo(Baby::class);
    }
}
